"""全量爬取韩服官方指南物品列表，提取所有引用的图标 ID（审计用）。

用途：核对"图床/基线之外的图标缺口"或生成物品图标全集快照。
注意：指南物品列表不等于图床全集（200709 这类图不在列表里）；段级补全请用
sync_kr_item_icons.py --sweep-folder。

- 复用 build_kr_guide_item_map.py 的页面解析与限速抓取。
- 单并发；每页间隔 2s；失败重试；每页结果原子落盘，中断后重跑自动续爬。
- 输出：<output>(默认 server/glamour/.runtime/kr-guide-icon-crawl/icons-<date>.json)。
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS_DIR))
import build_kr_guide_item_map as kr  # noqa: E402

BASE_URL = "https://guide.ff14.co.kr/lodestone/db/item"
PAGE_SIZE = 30
MAX_PAGES = 1600
DELAY_SECONDS = 2.0
RUNTIME_DIR = TOOLS_DIR.parent / ".runtime"


def page_state_path(cache_dir: Path, page: int) -> Path:
    return cache_dir / f"page-{page:05d}.json"


def crawl(cache_dir: Path):
    cache_dir.mkdir(parents=True, exist_ok=True)
    icons = set()
    item_count = 0
    page = 1
    last_page = None
    while page <= MAX_PAGES:
        state_path = page_state_path(cache_dir, page)
        if state_path.is_file():
            payload = json.loads(state_path.read_text(encoding="utf-8"))
            page_icons = payload["icons"]
            page_items = payload["items"]
            is_last = payload["last"]
        else:
            html = kr.fetch_text(f"{BASE_URL}?page={page}", timeout_seconds=30, max_retries=3)
            records = kr.parse_guide_item_page(html)
            page_icons = sorted({r.icon for r in records if r.icon > 0})
            page_items = len(records)
            is_last = page_items < PAGE_SIZE
            tmp = state_path.with_suffix(".tmp")
            tmp.write_text(
                json.dumps({"page": page, "items": page_items, "icons": page_icons, "last": is_last}),
                encoding="utf-8",
            )
            tmp.replace(state_path)
            time.sleep(DELAY_SECONDS)
        icons.update(page_icons)
        item_count += page_items
        if page % 50 == 0:
            print(f"[page {page}] distinctIcons={len(icons)}", flush=True)
        if is_last:
            last_page = page
            break
        page += 1

    if last_page is None:
        raise RuntimeError(f"爬取达到 MAX_PAGES={MAX_PAGES} 仍未找到最后一页")
    return icons, item_count, last_page


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="爬取韩服指南物品列表图标全集（审计用）")
    parser.add_argument("--cache-dir", default=str(RUNTIME_DIR / "kr-guide-icon-crawl" / "pages"))
    parser.add_argument("--output", default=None,
                        help="默认 server/glamour/.runtime/kr-guide-icon-crawl/icons-<UTC日期>.json")
    args = parser.parse_args()
    cache_dir = Path(args.cache_dir)
    output = Path(args.output) if args.output else (
        RUNTIME_DIR / "kr-guide-icon-crawl" / f"icons-{datetime.now(timezone.utc).date().isoformat()}.json"
    )

    icons, item_count, last_page = crawl(cache_dir)
    payload = {
        "crawledAt": datetime.now(timezone.utc).isoformat(),
        "source": BASE_URL,
        "pages": last_page,
        "itemsSeen": item_count,
        "distinctIconCount": len(icons),
        "icons": sorted(icons),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    tmp.replace(output)
    print(f"DONE pages={last_page} items={item_count} distinctIcons={len(icons)}")
    print(f"output={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
