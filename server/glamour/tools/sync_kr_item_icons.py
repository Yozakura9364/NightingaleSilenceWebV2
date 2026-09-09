"""韩服物品高清图标（_hd.png）增量同步工具。

素材链路：韩服官方指南图床 -> 本地基线(H:\\解包\\icon-kr) -> COS 镜像(nine-1326554799/ui/icon) -> COS/CDN。

- 来源 URL 形如 https://image.ff14.co.kr/guide/resources/images/GV7.5/<folder>/<id>.png，
  已与既有 icon-kr 基线做 SHA-256 三样本比对确认；远端文件名无 _hd 后缀，落盘统一为 <id>_hd.png。
- 缺口默认按当前韩文 Item.csv 的 Icon 列与基线求差；对 200000 这类"图床存在但 Item.csv
  不引用"的段，用 --sweep-folder 全段探测补全。
- 只新增、不覆盖、不删除；已存在的 _hd 文件不会重新请求。
- 机器路径不写入本仓库：从已忽略的 server/glamour/.runtime/kr-icon-sync-config.json 读取，
  CLI 参数可逐项覆盖。

用法：
  python server/glamour/tools/sync_kr_item_icons.py --check          # 只算缺口
  python server/glamour/tools/sync_kr_item_icons.py                  # 按 Item.csv 补缺
  python server/glamour/tools/sync_kr_item_icons.py --sweep-folder 200000
"""

import argparse
import csv
import hashlib
import io
import json
import os
import struct
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
GLAMOUR_DIR = TOOLS_DIR.parent
RUNTIME_DIR = GLAMOUR_DIR / ".runtime"
CONFIG_PATH = RUNTIME_DIR / "kr-icon-sync-config.json"
REPORT_DIR = RUNTIME_DIR / "kr-icon-sync"

DEFAULT_SOURCE_TEMPLATE = (
    "https://image.ff14.co.kr/guide/resources/images/GV7.5/{folder}/{id}.png"
)
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
MAX_BYTES = 1024 * 1024
MAX_RETRIES = 3
RETRY_BASE_SECONDS = 1.5
TIMEOUT_SECONDS = 15
USER_AGENT = "NightingaleSilence KR guide icon sync/1.0"
REFERER = "https://guide.ff14.co.kr/"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def icon_relative_path(icon_id: int) -> str:
    name = f"{icon_id:06d}_hd.png"
    return f"{name[:3]}000/{name}"


def source_url_for(template: str, icon_id: int) -> str:
    name = f"{icon_id:06d}"
    return template.format(folder=name[:3] + "000", id=name)


def parse_csv_icon_ids(text: str) -> set:
    rows = list(csv.reader(io.StringIO(text)))
    if len(rows) < 4:
        raise ValueError("Item.csv 内容过短（需要三行表头 + 数据行）")
    headers = [value.strip().lstrip("﻿").strip() for value in rows[1]]
    if "Icon" not in headers:
        raise ValueError("Item.csv 第二行找不到 Icon 列")
    icon_idx = headers.index("Icon")
    ids = set()
    for row in rows[3:]:
        if len(row) <= icon_idx:
            continue
        value = row[icon_idx].strip()
        if value.isdigit() and 0 < int(value) <= 999999:
            ids.add(int(value))
    return ids


def scan_baseline_ids(baseline_dir: Path) -> set:
    ids = set()
    if not baseline_dir.is_dir():
        raise ValueError(f"基线目录不存在: {baseline_dir}")
    for path in baseline_dir.rglob("*_hd.png"):
        name = path.name
        if len(name) == 13 and name.endswith("_hd.png") and name[:6].isdigit():
            ids.add(int(name[:6]))
    return ids


def load_config(overrides: dict, config_path=None) -> dict:
    path = Path(config_path) if config_path else CONFIG_PATH
    if path.is_file():
        config = json.loads(path.read_text(encoding="utf-8"))
    else:
        config = {}
    config.update({key: value for key, value in overrides.items() if value is not None})
    for required in ("csvPath", "baselineDir", "mirrorDir"):
        if not config.get(required):
            raise ValueError(
                f"缺少配置项 {required}：请在 {path} 或 CLI 参数中提供"
                f"（模板见 docs/ai/data/ffxiv/kr-item-icon-sync.md）"
            )
    config.setdefault("sourceTemplate", DEFAULT_SOURCE_TEMPLATE)
    config.setdefault("workers", 4)
    config.setdefault("maxRetries", MAX_RETRIES)
    config.setdefault("timeoutSeconds", TIMEOUT_SECONDS)
    config.setdefault("requestIntervalSeconds", 0)
    config.setdefault("stagingDir", None)
    return config


def fetch_icon(template: str, icon_id: int, max_retries: int, timeout_seconds: float):
    """返回 (data, error)；error 为 (kind, message)。404 视为 not-exists。"""
    source_url = source_url_for(template, icon_id)
    last = None
    for attempt in range(max_retries + 1):
        try:
            request = urllib.request.Request(
                source_url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept-Language": "ko-KR,ko;q=0.9",
                    "Referer": REFERER,
                },
            )
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                data = response.read(MAX_BYTES + 1)
            if not data.startswith(PNG_MAGIC):
                return None, ("invalid", "not PNG", source_url)
            return data, (None, None, source_url)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None, ("not-exists", "HTTP 404", source_url)
            last = ("network", f"HTTP {error.code}", source_url)
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last = ("network", f"network: {error}", source_url)
        if attempt < max_retries:
            time.sleep(RETRY_BASE_SECONDS * (attempt + 1))
    return None, last


def write_all_targets(data: bytes, relative_path: str, targets: list):
    for root in targets:
        target = Path(root) / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.is_file():
            continue
        tmp = target.with_suffix(".tmp")
        tmp.write_bytes(data)
        os.replace(tmp, target)


def worker(queue, results, config, targets, counter, lock):
    interval = config["requestIntervalSeconds"]
    while True:
        try:
            icon_id = queue.get_nowait()
        except Exception:
            return
        data, err = fetch_icon(
            config["sourceTemplate"], icon_id, config["maxRetries"], config["timeoutSeconds"]
        )
        kind, message, source_url = err
        if data:
            relative_path = icon_relative_path(icon_id)
            write_all_targets(data, relative_path, targets)
            results["manifest"].append({
                "iconId": icon_id,
                "relativePath": relative_path,
                "sourceUrl": source_url,
                "sha256": hashlib.sha256(data).hexdigest(),
                "byteSize": len(data),
                "width": struct.unpack(">II", data[16:24])[0],
                "height": struct.unpack(">II", data[16:24])[1],
                "fetchedAt": now_iso(),
            })
            line = f"OK {icon_id:06d} {len(data)}B"
        else:
            results[kind].append({
                "iconId": icon_id, "sourceUrl": source_url,
                "kind": kind, "error": message, "recordedAt": now_iso(),
            })
            line = f"{kind.upper()} {icon_id:06d} {message}"
        with lock:
            counter[0] += 1
            done = counter[0]
        print(f"[{done}] {line}", flush=True)
        if interval > 0:
            time.sleep(interval)


def download_all(icon_ids, config, targets):
    import queue as queue_mod

    queue = queue_mod.Queue()
    for icon_id in icon_ids:
        queue.put(icon_id)
    results = {"manifest": [], "not-exists": [], "network": [], "invalid": []}
    counter = [0]
    lock = threading.Lock()
    workers = max(1, int(config["workers"]))
    threads = [
        threading.Thread(target=worker, args=(queue, results, config, targets, counter, lock), daemon=True)
        for _ in range(workers)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    return results


def write_report(payload: dict) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = REPORT_DIR / f"report-{stamp}.json"
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)
    return path


def summarize(mode, missing, results, config, elapsed):
    return {
        "mode": mode,
        "generatedAt": now_iso(),
        "csvPath": config.get("csvPath"),
        "sourceBaseUrl": config["sourceTemplate"],
        "missingCount": len(missing),
        "downloaded": len(results["manifest"]),
        "notExists": len(results["not-exists"]),
        "failed": len(results["network"]),
        "invalid": len(results["invalid"]),
        "workers": config["workers"],
        "elapsedSeconds": round(elapsed, 1),
        "targets": [str(Path(target)) for target in targets_for(config)],
    }


def targets_for(config):
    targets = [config["baselineDir"], config["mirrorDir"]]
    if config.get("stagingDir"):
        targets.append(config["stagingDir"])
    return targets


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="韩服物品高清图标增量同步")
    parser.add_argument("--check", action="store_true", help="只计算缺口，不联网不写盘")
    parser.add_argument("--sweep-folder", type=int, metavar="NNN000",
                        help="整段探测一个目录（如 200000），补齐图床存在但 Item.csv 不引用的图标")
    parser.add_argument("--csv", dest="csvPath", default=None)
    parser.add_argument("--baseline", dest="baselineDir", default=None)
    parser.add_argument("--mirror", dest="mirrorDir", default=None)
    parser.add_argument("--staging", dest="stagingDir", default=None)
    parser.add_argument("--source-template", dest="sourceTemplate", default=None)
    parser.add_argument("--workers", type=int, default=None)
    args = parser.parse_args()

    config = load_config({
        "csvPath": args.csvPath,
        "baselineDir": args.baselineDir,
        "mirrorDir": args.mirrorDir,
        "stagingDir": args.stagingDir,
        "sourceTemplate": args.sourceTemplate,
        "workers": args.workers,
    })

    csv_text = Path(config["csvPath"]).read_text(encoding="utf-8-sig")
    csv_ids = parse_csv_icon_ids(csv_text)
    existing = scan_baseline_ids(Path(config["baselineDir"]))

    if args.sweep_folder is not None:
        folder_start = (args.sweep_folder // 1000) * 1000
        missing = [i for i in range(folder_start, folder_start + 1000) if i not in existing]
        mode = f"sweep-folder {folder_start:06d}"
    else:
        missing = sorted(csv_ids - existing)
        mode = "csv-diff"

    print(f"mode={mode} csvIcons={len(csv_ids)} localHd={len(existing)} missing={len(missing)}")
    if args.sweep_folder is not None:
        print("（sweep 的 missing 是待探测编号；图床上不存在的空洞会记为 notExists，不算失败）")
    if args.check:
        from collections import Counter

        by_folder = Counter(f"{i // 1000 * 1000:06d}" for i in missing)
        print("缺口分布:", dict(sorted(by_folder.items())))
        return 0
    if not missing:
        print("没有缺口，无需下载。")
        return 0

    started = time.time()
    results = download_all(missing, config, targets_for(config))
    summary = summarize(mode, missing, results, config, time.time() - started)
    report = {"summary": summary, "manifest": results["manifest"], "failures": results["network"] + results["invalid"]}
    report_path = write_report(report)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"report={report_path}")
    if results["network"] or results["invalid"]:
        failed_ids = sorted(item["iconId"] for item in results["network"] + results["invalid"])
        print(f"存在失败，可重跑本命令自动只补失败项：{failed_ids}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
