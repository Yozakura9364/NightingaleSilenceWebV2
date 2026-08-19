"""石之家（Risingstones）详情解析与远程读取。"""

import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List

try:
    from .adapters.ec_scraper import EC_SLOT_ORDER
    from .resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
    )
    from .services.text_import import (
        build_fallback_rs_candidate,
        build_model_from_candidate,
        find_item_record_by_id,
        find_item_record_by_name,
        get_record_dye_count,
        known_stain_ids,
        pad_dye_ids,
        resolve_stain_id_by_hex,
        resolve_stain_id_by_name,
    )
    from .services.text_utils import normalize_space
except ImportError:
    from adapters.ec_scraper import EC_SLOT_ORDER
    from resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
    )
    from services.text_import import (
        build_fallback_rs_candidate,
        build_model_from_candidate,
        find_item_record_by_id,
        find_item_record_by_name,
        get_record_dye_count,
        known_stain_ids,
        pad_dye_ids,
        resolve_stain_id_by_hex,
        resolve_stain_id_by_name,
    )
    from services.text_utils import normalize_space

RS_ALLOWED_ORIGIN = "https://ff14risingstones.web.sdo.com"
RS_GLAMOUR_HOME_URL = f"{RS_ALLOWED_ORIGIN}/pc/index.html#/post"
RS_REMOTE_READER_URL = os.environ.get("NSGLAMOUR_RS_READER_URL", "").strip().rstrip("/")
RS_REMOTE_READER_TOKEN_FILE = Path(
    os.environ.get("NSGLAMOUR_RS_READER_TOKEN_FILE", str(Path(__file__).resolve().parent.parent / ".runtime" / "risingstones-reader-token"))
)
RS_REMOTE_READER_MAX_BYTES = 2 * 1024 * 1024
RS_READABLE_ERROR_PATTERNS = [
    (
        re.compile(r"请先登录", re.IGNORECASE),
        "石之家读取失效！请联系网站博主",
    ),
    (
        re.compile(r"登录页|login\.u\.sdo\.com|未登录|login", re.IGNORECASE),
        "石之家后台浏览器还没有完成登录。请先点“后台登录”，在弹出的专用浏览器里登录小号，登录后刷新石之家页面再重试。",
    ),
    (
        re.compile(r"没有找到已登录|没有找到.*石之家后台页面|No page", re.IGNORECASE),
        "没有找到已登录的石之家页面。请先点“后台登录”，确认专用浏览器打开的是石之家并且右上角已经登录。",
    ),
    (
        re.compile(r"DevTools|WebSocket|remote debugging|连接已关闭|握手|拒绝连接|无法连接", re.IGNORECASE),
        "连接后台浏览器失败。请确认服务器上的石之家专用浏览器仍在运行，DevTools 端口只监听 127.0.0.1，必要时重新执行登录脚本。",
    ),
    (
        re.compile(r"启动超时|没有找到 Chrome|Chromium|Edge|NSGLAMOUR_CHROME_PATH", re.IGNORECASE),
        "无法启动石之家后台浏览器。请检查服务器是否安装 Chrome/Chromium，或设置 NSGLAMOUR_CHROME_PATH 指向浏览器可执行文件。",
    ),
    (
        re.compile(r"接口错误|HTTP\s*(401|403)|unauthorized|forbidden|权限|风控", re.IGNORECASE),
        "石之家接口拒绝了这次读取。通常是登录态失效、账号需要验证，或刚登录后页面没有刷新；请重新打开后台登录页确认后再试。",
    ),
    (
        re.compile(r"failed to fetch|networkerror|err_", re.IGNORECASE),
        "石之家后台浏览器的请求被站点拦截了。程序会优先尝试改用非 headless 浏览器重试；如果仍失败，请确认服务器上的 Xvfb/桌面正常，并重新登录石之家小号。",
    ),
    (
        re.compile(r"详情 ID|detail", re.IGNORECASE),
        "没有识别到石之家幻化详情 ID。请粘贴形如 ff14risingstones.web.sdo.com/pc/index.html#/glamour/detail/数字 的详情链接，或直接输入详情 ID。",
    ),
]

RS_SLOT_TO_NS_SLOT = {
    "MAIN_HAND": "MainHand",
    "OFF_HAND": "OffHand",
    "HEAD": "HeadGear",
    "BODY": "Body",
    "GLOVES": "Hands",
    "LEGS": "Legs",
    "FEET": "Feet",
    "EARS": "Ears",
    "NECK": "Neck",
    "WRISTS": "Wrists",
    "FINGER_LEFT": "LeftRing",
    "FINGER_RIGHT": "RightRing",
}

RS_SLOT_LABELS = {
    "MAIN_HAND": "主手",
    "OFF_HAND": "副手",
    "HEAD": "头部",
    "BODY": "上衣",
    "GLOVES": "手部",
    "LEGS": "腿部",
    "FEET": "脚部",
    "EARS": "耳坠",
    "NECK": "项链",
    "WRISTS": "手镯",
    "FINGER_LEFT": "戒指",
    "FINGER_RIGHT": "戒指",
}


def get_rs_text(value: Any) -> str:
    if value is None:
        return ""
    return normalize_space(str(value))


def get_rs_id(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def get_rs_equipment_name(equipment: Dict[str, Any]) -> str:
    for key in ("name", "equipment_name", "equip_name", "item_name", "itemName"):
        value = get_rs_text(equipment.get(key))
        if value:
            return value
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("name", "equipment_name", "item_name"):
            value = get_rs_text(detail.get(key))
            if value:
                return value
    return ""


def get_rs_equipment_icon(equipment: Dict[str, Any]) -> int:
    for key in ("icon_id", "iconId", "icon"):
        icon = get_rs_id(equipment.get(key))
        if icon:
            return icon
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("icon_id", "iconId", "icon"):
            icon = get_rs_id(detail.get(key))
            if icon:
                return icon
    return 0


def get_rs_equipment_id(equipment: Dict[str, Any]) -> int:
    for key in ("equipment_id", "equipmentId", "item_id", "itemId", "id"):
        item_id = get_rs_id(equipment.get(key))
        if item_id:
            return item_id
    detail = equipment.get("detail") or equipment.get("equipment") or equipment.get("equipment_info") or {}
    if isinstance(detail, dict):
        for key in ("id", "equipment_id", "item_id"):
            item_id = get_rs_id(detail.get(key))
            if item_id:
                return item_id
    return 0


def get_rs_dye_id_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_dye_ids = equipment.get("dye_ids")
    raw_values: List[Any] = []
    if isinstance(raw_dye_ids, str):
        raw_values.extend(part for part in raw_dye_ids.split(",") if part.strip())
    elif isinstance(raw_dye_ids, list):
        raw_values.extend(raw_dye_ids)

    slots = []
    for value in raw_values[:2]:
        if isinstance(value, dict):
            slots.append(
                {
                    "id": get_rs_id(value.get("id")),
                    "name": get_rs_text(value.get("name")),
                    "color": get_rs_text(value.get("color") or value.get("hex")),
                }
            )
        else:
            slots.append({"id": get_rs_id(value)})
    return slots


def get_rs_dye_object_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    dyes = equipment.get("dyes")
    if not isinstance(dyes, list):
        return []

    slots = []
    for dye in dyes[:2]:
        if isinstance(dye, dict):
            slots.append(
                {
                    "id": get_rs_id(dye.get("id")),
                    "name": get_rs_text(dye.get("name")),
                    "color": get_rs_text(dye.get("color") or dye.get("hex")),
                }
            )
        else:
            slots.append({"id": get_rs_id(dye), "name": get_rs_text(dye), "color": ""})
    return slots


def merge_rs_dye_slot(target: Dict[str, Any], source: Dict[str, Any], replace_empty_id: bool = False) -> None:
    target_id = get_rs_id(target.get("id"))
    source_id = get_rs_id(source.get("id"))
    if replace_empty_id and target_id <= 0 and source_id > 0:
        target["id"] = source_id
        target_id = source_id
    if target_id > 0 and source_id > 0 and target_id != source_id:
        return
    if target_id <= 0 and source_id > 0:
        return
    if not get_rs_text(target.get("name")) and get_rs_text(source.get("name")):
        target["name"] = get_rs_text(source.get("name"))
    if not get_rs_text(target.get("color")) and get_rs_text(source.get("color")):
        target["color"] = get_rs_text(source.get("color"))


def get_rs_dye_slots(equipment: Dict[str, Any]) -> List[Dict[str, Any]]:
    id_slots = get_rs_dye_id_slots(equipment)
    object_slots = get_rs_dye_object_slots(equipment)
    if object_slots and len(object_slots) > len(id_slots):
        return object_slots[:2]

    slots = [dict(slot) for slot in id_slots]
    if not slots:
        slots = [dict(slot) for slot in object_slots]
    else:
        if len(object_slots) == len(slots):
            for index, object_slot in enumerate(object_slots):
                merge_rs_dye_slot(slots[index], object_slot)
        else:
            by_id = {get_rs_id(slot.get("id")): slot for slot in slots if get_rs_id(slot.get("id")) > 0}
            for object_slot in object_slots:
                matched_slot = by_id.get(get_rs_id(object_slot.get("id")))
                if matched_slot is not None:
                    merge_rs_dye_slot(matched_slot, object_slot)
    return slots[:2]


def get_rs_dye_ids(equipment: Dict[str, Any]) -> List[int]:
    return [get_rs_id(slot.get("id")) for slot in get_rs_dye_slots(equipment)]


def get_rs_dye_names(equipment: Dict[str, Any]) -> List[str]:
    return [get_rs_text(slot.get("name")) for slot in get_rs_dye_slots(equipment)]


def get_rs_dye_colors(equipment: Dict[str, Any]) -> List[str]:
    return [get_rs_text(slot.get("color")) for slot in get_rs_dye_slots(equipment)]


def parse_rs_equipment(detail: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_equipments = detail.get("equipments") or detail.get("equipment") or []
    if isinstance(raw_equipments, str):
        try:
            raw_equipments = json.loads(raw_equipments)
        except json.JSONDecodeError:
            raw_equipments = []
    if not isinstance(raw_equipments, list):
        raise ValueError("石之家详情里没有可识别的装备列表")

    entries = []
    for equipment in raw_equipments:
        if not isinstance(equipment, dict):
            continue
        rs_slot = get_rs_text(equipment.get("slot") or equipment.get("part_name")).upper()
        slot_name = RS_SLOT_TO_NS_SLOT.get(rs_slot)
        item_id = get_rs_equipment_id(equipment)
        if not slot_name or item_id <= 0:
            continue
        entries.append(
            {
                "slot": slot_name,
                "rs_slot": rs_slot,
                "rs_slot_label": RS_SLOT_LABELS.get(rs_slot, rs_slot),
                "item_id": item_id,
                "item_name": get_rs_equipment_name(equipment),
                "icon": get_rs_equipment_icon(equipment),
                "dye_ids": get_rs_dye_ids(equipment),
                "dye_names": get_rs_dye_names(equipment),
                "dye_colors": get_rs_dye_colors(equipment),
            }
        )

    if not entries:
        raise ValueError("未在石之家详情中识别到可导入装备")

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    entries.sort(key=lambda entry: order.get(entry["slot"], len(order)))
    return entries


def build_rs_resolved_entry(entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    slot_name = entry["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    record = find_item_record_by_id(mapping, entry.get("item_id", 0), slot_name)
    if not record and entry.get("item_name"):
        record = find_item_record_by_name(mapping, entry["item_name"], slot_name)

    raw_candidate = record or build_fallback_rs_candidate(entry, slot_label)
    raw_candidate = {
        **raw_candidate,
        "icon": raw_candidate.get("icon") or entry.get("icon", 0),
        "dye_count": get_record_dye_count(raw_candidate, slot_name),
    }
    stains = known_stain_ids(mapping)
    dye_count = int(raw_candidate.get("dye_count", 0) or 0)
    raw_dye_ids = entry.get("dye_ids", []) if isinstance(entry.get("dye_ids"), list) else []
    raw_dye_names = entry.get("dye_names", []) if isinstance(entry.get("dye_names"), list) else []
    raw_dye_colors = entry.get("dye_colors", []) if isinstance(entry.get("dye_colors"), list) else []
    dye_ids = []
    for index in range(min(dye_count, 2)):
        dye_id = get_rs_id(raw_dye_ids[index]) if index < len(raw_dye_ids) else 0
        if dye_id > 0 and dye_id not in stains:
            dye_id = 0
        if dye_id <= 0 and index < len(raw_dye_names):
            dye_id = resolve_stain_id_by_name(mapping, raw_dye_names[index])
        if dye_id <= 0 and index < len(raw_dye_colors):
            dye_id = resolve_stain_id_by_hex(mapping, raw_dye_colors[index])
        dye_ids.append(dye_id if dye_id > 0 else 0)
    dye_ids = pad_dye_ids(dye_ids, dye_count)
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    if record:
        model = build_model_from_candidate(slot_name, candidate)
        if slot_name in {"MainHand", "OffHand"}:
            lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
        else:
            lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        model = {}
        lookup_key = f"RS|{slot_name}|{entry.get('item_id', 0)}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "石之家",
            "slot": entry.get("rs_slot_label", entry.get("rs_slot", "")),
            "item_id": entry.get("item_id", 0),
            "item_name": entry.get("item_name", ""),
            "dye_ids": dye_ids,
            "dyes": entry.get("dye_names", []),
            "dye_colors": entry.get("dye_colors", []),
            "matched": bool(record),
        },
    }


def get_rs_gender_label(value: Any) -> str:
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return ""
    if numeric == 1:
        return "Male"
    if numeric == 2:
        return "Female"
    return ""


def get_rs_first_name(values: Any) -> str:
    if isinstance(values, list) and values:
        first = values[0]
        if isinstance(first, dict):
            return get_rs_text(first.get("name"))
        return get_rs_text(first)
    return ""


def parse_rs_glamour_payload(detail: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    title = get_rs_text(detail.get("title")) or f"石之家幻化 {detail.get('id', '')}".strip()
    author = " ".join(
        part
        for part in [
            get_rs_text(detail.get("character_name")),
            get_rs_text(detail.get("group_name")),
        ]
        if part
    )
    gender_ids = detail.get("gender_ids")
    gender = get_rs_gender_label(gender_ids[0] if isinstance(gender_ids, list) and gender_ids else gender_ids)
    equipment = parse_rs_equipment(detail)

    return {
        "file_type": "石之家",
        "source_name": title or "石之家幻化",
        "source_url": f"https://ff14risingstones.web.sdo.com/pc/index.html#/glamour/detail/{detail.get('id')}" if detail.get("id") else "",
        "source_title": title,
        "source_author": author,
        "author": {
            "name": get_rs_text(detail.get("character_name")),
            "world": get_rs_text(detail.get("group_name")),
            "label": author,
        },
        "race": get_rs_first_name(detail.get("race_ids")),
        "gender": gender,
        "locales": metadata.get("locales", get_locales(mapping)),
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "resolved_equipment": [build_rs_resolved_entry(entry, mapping) for entry in equipment],
    }


def extract_risingstones_glamour_ids(value: str) -> List[str]:
    text = str(value or "").strip()
    if not text:
        return []
    ids: List[str] = []
    patterns = [
        r"[#/](?:glamour|publish/glamour)/detail/(\d+)",
        r"[?&](?:id|glamour_id|glamourId)=(\d+)",
        r"(?:^|\D)(\d{4,})(?=\D|$)",
    ]
    for pattern in patterns:
        ids.extend(re.findall(pattern, text, flags=re.IGNORECASE))
    return list(dict.fromkeys(ids))


def read_risingstones_reader_token() -> str:
    try:
        token = RS_REMOTE_READER_TOKEN_FILE.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise RuntimeError("石之家远程读取器鉴权文件不可用") from exc
    if not token:
        raise RuntimeError("石之家远程读取器鉴权文件为空")
    return token


def read_risingstones_details_via_remote_reader(ids: List[str]) -> Dict[str, Any]:
    if not RS_REMOTE_READER_URL:
        raise RuntimeError("石之家远程读取器未配置")
    parsed = urllib.parse.urlparse(RS_REMOTE_READER_URL)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise RuntimeError("石之家远程读取器地址无效")
    body = json.dumps({"ids": ids}, ensure_ascii=False).encode("utf-8")
    request_obj = urllib.request.Request(
        f"{RS_REMOTE_READER_URL}/v1/glamour-detail",
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {read_risingstones_reader_token()}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=45) as response:
            raw_body = response.read(RS_REMOTE_READER_MAX_BYTES + 1)
            status_code = int(getattr(response, "status", response.getcode()))
    except urllib.error.HTTPError as exc:
        raw_body = exc.read(RS_REMOTE_READER_MAX_BYTES + 1)
        status_code = int(exc.code)
    except Exception as exc:
        raise RuntimeError(f"石之家远程读取器请求失败: {exc}") from exc
    if len(raw_body) > RS_REMOTE_READER_MAX_BYTES:
        raise RuntimeError("石之家远程读取器响应过大")
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:
        raise RuntimeError("石之家远程读取器返回了无法解析的数据") from exc
    if not isinstance(payload, dict):
        raise RuntimeError("石之家远程读取器返回格式异常")
    if not (200 <= status_code < 300) or payload.get("ok") is False:
        message = str(payload.get("error") or f"HTTP {status_code}")
        raise RuntimeError(f"石之家远程读取器失败: {message}")
    details = payload.get("details")
    failures = payload.get("failures")
    returned_ids = [str(item) for item in (payload.get("ids") or [])]
    if returned_ids != [str(item) for item in ids]:
        raise RuntimeError("石之家远程读取器返回的详情 ID 不匹配")
    if not isinstance(details, list) or not isinstance(failures, list):
        raise RuntimeError("石之家远程读取器缺少详情数据")
    return {
        "ok": True,
        "ids": ids,
        "details": [item for item in details if isinstance(item, dict)],
        "failures": [item for item in failures if isinstance(item, dict)],
        "page": RS_GLAMOUR_HOME_URL,
        "mode": "remote-reader",
    }


def read_risingstones_details(ids: List[str]) -> Dict[str, Any]:
    if not RS_REMOTE_READER_URL:
        raise RuntimeError("石之家 Reader 尚未配置")
    return read_risingstones_details_via_remote_reader(ids)


def humanize_risingstones_error(error: Any) -> str:
    message = str(error or "").strip()
    if not message:
        return "石之家读取失败。请确认后台浏览器已经登录石之家，并重新尝试。"
    for pattern, readable in RS_READABLE_ERROR_PATTERNS:
        if pattern.search(message):
            return readable
    return f"石之家读取失败：{message}"
