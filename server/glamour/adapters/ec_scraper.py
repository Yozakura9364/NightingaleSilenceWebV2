"""Eorzea Collection 页面抓取与解析适配器（只依赖 stdlib 与 text_utils）。"""

import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Tuple

try:
    from .services.text_utils import (
        get_html_attr,
        html_tag_has_classes,
        iter_div_blocks,
        normalize_lookup_text,
        normalize_space,
        text_from_html,
    )
except ImportError:
    from services.text_utils import (
        get_html_attr,
        html_tag_has_classes,
        iter_div_blocks,
        normalize_lookup_text,
        normalize_space,
        text_from_html,
    )

EC_ALLOWED_HOST = "ffxiv.eorzeacollection.com"
EC_MAX_HTML_BYTES = 1_200_000
EC_USER_AGENT = "Mozilla/5.0 (compatible; NSGlamour/1.0)"

EC_SLOT_TO_NS_SLOT = {
    "WEAPON": "MainHand",
    "MAIN HAND": "MainHand",
    "MAINHAND": "MainHand",
    "OFF HAND": "OffHand",
    "OFFHAND": "OffHand",
    "SHIELD": "OffHand",
    "HEAD": "HeadGear",
    "BODY": "Body",
    "CHEST": "Body",
    "HANDS": "Hands",
    "GLOVES": "Hands",
    "LEGS": "Legs",
    "FEET": "Feet",
    "EARRINGS": "Ears",
    "EARS": "Ears",
    "NECKLACE": "Neck",
    "NECK": "Neck",
    "BRACELETS": "Wrists",
    "BRACELET": "Wrists",
    "WRISTS": "Wrists",
    "LEFT RING": "LeftRing",
    "RING 1": "LeftRing",
    "RIGHT RING": "RightRing",
    "RING 2": "RightRing",
    "RING": "LeftRing",
    "FACE": "Glasses",
    "FACEWEAR": "Glasses",
    "FACE WEAR": "Glasses",
    "FACE ACCESSORY": "Glasses",
    "FACE ACCESSORIES": "Glasses",
    "GLASSES": "Glasses",
    "FASHION ACCESSORY": "FashionAccessory",
    "FASHION ACCESSORIES": "FashionAccessory",
    "FASHION": "FashionAccessory",
}

EC_LEGACY_CSS_SLOT_TO_NS_SLOT = {
    "weapon": "MainHand",
    "offhand": "OffHand",
    "head": "HeadGear",
    "body": "Body",
    "hands": "Hands",
    "legs": "Legs",
    "feet": "Feet",
    "ears": "Ears",
    "earrings": "Ears",
    "neck": "Neck",
    "necklace": "Neck",
    "wrists": "Wrists",
    "bracelets": "Wrists",
    "ring": "LeftRing",
    "face": "Glasses",
    "facewear": "Glasses",
    "fashion": "FashionAccessory",
}

EC_SLOT_ORDER = [
    "MainHand",
    "OffHand",
    "HeadGear",
    "Body",
    "Hands",
    "Legs",
    "Feet",
    "Ears",
    "Neck",
    "Wrists",
    "LeftRing",
    "RightRing",
    "Glasses",
    "FashionAccessory",
]


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def validate_ec_url(raw_url: str) -> str:
    url = str(raw_url or "").strip()
    if not url:
        raise ValueError("请输入 Eorzea Collection 幻化链接")

    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"https", "http"}:
        raise ValueError("只支持 Eorzea Collection 的 http/https 链接")
    if parsed.hostname != EC_ALLOWED_HOST:
        raise ValueError("只支持 ffxiv.eorzeacollection.com 的幻化链接")
    if not re.fullmatch(r"/glamour/\d+(?:/[^/?#]+)?/?", parsed.path):
        raise ValueError("链接不是有效的 Eorzea Collection glamour 投稿页")

    return urllib.parse.urlunparse(parsed._replace(fragment=""))


def is_ec_access_blocked_page(document: str) -> bool:
    text = normalize_space(text_from_html(document)).lower()
    return (
        "sorry, you have been blocked" in text
        or "you are unable to access eorzeacollection.com" in text
        or ("cloudflare" in text and "access denied" in text)
    )


def ec_access_blocked_error() -> ValueError:
    return ValueError(
        "Eorzea Collection 当前拒绝此服务器访问，暂时无法读取该链接。请稍后重试或使用装备文字导入。"
    )


def fetch_ec_html(raw_url: str) -> Tuple[str, str]:
    opener = urllib.request.build_opener(NoRedirectHandler)
    url = validate_ec_url(raw_url)

    for _ in range(4):
        request_obj = urllib.request.Request(url, headers={"User-Agent": EC_USER_AGENT})
        try:
            with opener.open(request_obj, timeout=12) as response:
                final_url = validate_ec_url(response.geturl())
                data = response.read(EC_MAX_HTML_BYTES + 1)
                if len(data) > EC_MAX_HTML_BYTES:
                    raise ValueError("Eorzea Collection 页面过大，已停止读取")
                charset = response.headers.get_content_charset() or "utf-8"
                document = data.decode(charset, errors="replace")
                if is_ec_access_blocked_page(document):
                    raise ec_access_blocked_error()
                return document, final_url
        except urllib.error.HTTPError as exc:
            if exc.code not in {301, 302, 303, 307, 308}:
                body = exc.read(EC_MAX_HTML_BYTES + 1)
                charset = exc.headers.get_content_charset() or "utf-8"
                if is_ec_access_blocked_page(body.decode(charset, errors="replace")):
                    raise ec_access_blocked_error() from exc
                raise ValueError(f"Eorzea Collection 返回错误：HTTP {exc.code}") from exc
            location = exc.headers.get("Location", "")
            if not location:
                raise ValueError("Eorzea Collection 返回了空跳转地址") from exc
            url = validate_ec_url(urllib.parse.urljoin(url, location))
        except urllib.error.URLError as exc:
            raise ValueError(f"无法读取 Eorzea Collection 页面：{exc.reason}") from exc

    raise ValueError("Eorzea Collection 页面跳转次数过多")


def extract_ec_title(document: str) -> str:
    title_match = re.search(r"(?is)<title\b[^>]*>(.*?)</title>", document)
    if not title_match:
        return ""
    title = text_from_html(title_match.group(1))
    return re.sub(r"\s*\|\s*Eorzea Collection\s*$", "", title).strip()


def extract_ec_divider_section(document: str, label: str) -> str:
    pattern = re.compile(
        rf"""(?is)<div\b[^>]*class=(?:"[^"]*\bdivider\b[^"]*"|'[^']*\bdivider\b[^']*')[^>]*>\s*{re.escape(label)}\s*</div>"""
    )
    start = pattern.search(document)
    if not start:
        return ""
    next_divider = re.search(
        r"""(?is)<div\b[^>]*class=(?:"[^"]*\bdivider\b[^"]*"|'[^']*\bdivider\b[^']*')[^>]*>""",
        document[start.end() :],
    )
    end = start.end() + next_divider.start() if next_divider else len(document)
    return document[start.end() : end]


def extract_ec_author(document: str) -> Dict[str, str]:
    section = extract_ec_divider_section(document, "Creator")
    name_match = re.search(r'(?is)<h3\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>(.*?)</h3>', section)
    world_match = re.search(r'(?is)<h4\b[^>]*class="[^"]*\bsubtitle\b[^"]*"[^>]*>(.*?)</h4>', section)
    name = text_from_html(name_match.group(1)) if name_match else ""
    world = text_from_html(world_match.group(1)) if world_match else ""
    if not name:
        legacy_match = re.search(
            r'(?is)<h2\b[^>]*class="[^"]*\bb-title-sub\b[^"]*"[^>]*>\s*by\s*<b\b[^>]*>(.*?)</b>\s*from\s*(.*?)</h2>',
            document,
        )
        if legacy_match:
            name = text_from_html(legacy_match.group(1))
            world = text_from_html(legacy_match.group(2))
    label_world = world.strip()
    world = world.replace("⧫", "").strip().strip("«»").strip()
    return {
        "name": name,
        "world": world,
        "label": " ".join(part for part in [name, label_world] if part).strip(),
    }


def extract_ec_character(document: str) -> Dict[str, str]:
    race_names = r"Hyur|Elezen|Lalafell|Miqo'?te|Roegadyn|Au Ra|Hrothgar|Viera"
    pattern = re.compile(rf"(?i)\b({race_names})\s+(Female|Male)\b")
    for match in pattern.finditer(text_from_html(document)):
        race = match.group(1).replace("Miqote", "Miqo'te")
        return {"race": race, "gender": match.group(2)}

    for image_match in re.finditer(r"(?is)<img\b[^>]*>", document):
        tag = image_match.group(0)
        classes = set(get_html_attr(tag, "class").split())
        if "c-set-fitting-icon" not in classes or "c-set-fitting-icon-unfit" in classes:
            continue
        gender_match = re.search(r"/genders/gender-(female|male)\.", get_html_attr(tag, "src"), flags=re.IGNORECASE)
        if gender_match:
            return {"race": "", "gender": gender_match.group(1).title()}
    return {"race": "", "gender": ""}


def parse_ec_icon_id(block: str) -> int:
    for image_match in re.finditer(r"(?is)<img\b[^>]*>", block):
        tag = image_match.group(0)
        classes = get_html_attr(tag, "class")
        if "gear-icon-image" not in classes and "b-info-box-item-icon" not in classes:
            continue
        src = get_html_attr(tag, "src")
        icon_match = re.search(r"/(\d{6})\.(?:png|jpg|webp)(?:\?|$)", src)
        if icon_match:
            return int(icon_match.group(1))
    return 0


def parse_ec_item_name(block: str) -> str:
    for image_match in re.finditer(r"(?is)<img\b[^>]*>", block):
        tag = image_match.group(0)
        if "gear-icon-image" in get_html_attr(tag, "class"):
            name = get_html_attr(tag, "alt")
            if name:
                return normalize_space(name)

    for title_block in iter_div_blocks(block, ["list-item-title"]):
        title = text_from_html(title_block)
        if title:
            return title

    legacy_name_match = re.search(
        r'(?is)<span\b[^>]*class="[^"]*\bc-gear-slot-item-name\b[^"]*"[^>]*>(.*?)</span>',
        block,
    )
    if legacy_name_match:
        return text_from_html(legacy_name_match.group(1))
    return ""


EMPTY_DYE_LOOKUP_TEXTS = {
    "",
    "undyed",
    "no dye",
    "no color",
    "no colour",
    "none",
    "no colour dye",
    "no color dye",
    "无染色",
    "無染色",
    "未染色",
    "染色なし",
    "染色無し",
    "無染色",
    "염색 없음",
    "염색 안 함",
    "염색안함",
    "염색 불가",
    "염색불가",
}


def is_empty_dye_text(value: str) -> bool:
    return normalize_lookup_text(value) in EMPTY_DYE_LOOKUP_TEXTS


def clean_ec_dye_name(value: str) -> str:
    text = normalize_space(value)
    text = re.sub(r"^[⬤●◯○\s]+", "", text).strip()
    if is_empty_dye_text(text):
        return "No Color"
    text = re.sub(r"(?:染剂|dye)\s*$", "", text, flags=re.IGNORECASE).strip()
    return "No Color" if is_empty_dye_text(text) else text


def is_empty_ec_dye_name(value: str) -> bool:
    return is_empty_dye_text(value) or is_empty_dye_text(clean_ec_dye_name(value))


def parse_ec_dyes(block: str) -> List[str]:
    dyes = []
    for tag_block in iter_div_blocks(block, ["tag"]):
        raw_dye = text_from_html(tag_block)
        if not raw_dye:
            continue
        dye = clean_ec_dye_name(raw_dye)
        if dye:
            dyes.append(dye)

    if not dyes:
        color_pattern = re.compile(
            r'(?is)<span\b[^>]*class="[^"]*\bc-gear-slot-item-info-color\b[^"]*"[^>]*>'
        )
        span_pattern = re.compile(r"(?is)</?span\b[^>]*>")
        position = 0
        while position < len(block):
            color_match = color_pattern.search(block, position)
            if not color_match:
                break
            depth = 0
            for span_match in span_pattern.finditer(block, color_match.start()):
                if span_match.group(0).lower().startswith("</"):
                    depth -= 1
                else:
                    depth += 1
                if depth == 0:
                    dye = clean_ec_dye_name(text_from_html(block[color_match.start() : span_match.end()]))
                    if dye:
                        dyes.append(dye)
                    position = span_match.end()
                    break
            else:
                break
    return dyes[:2]


def normalize_ec_slot(value: str) -> str:
    return re.sub(r"[\s_-]+", " ", str(value or "").strip().upper())


def extract_ec_legacy_equipment_section(document: str) -> str:
    marker = re.search(
        r'(?is)<span\b[^>]*class="[^"]*\bb-info-box-category-title\b[^"]*"[^>]*>\s*Equipment:\s*</span>',
        document,
    )
    if not marker:
        return ""
    start = document.rfind("<section", 0, marker.start())
    end = document.find("</section>", marker.end())
    if start < 0 or end < 0:
        return ""
    return document[start : end + len("</section>")]


def parse_ec_legacy_equipment(document: str) -> List[Dict[str, Any]]:
    section = extract_ec_legacy_equipment_section(document)
    if not section:
        return []

    entries = []
    generic_ring_count = 0
    for block in iter_div_blocks(section, ["b-info-box-item-wrapper"]):
        slot_class = ""
        for tag_match in re.finditer(r"(?is)<a\b[^>]*>", block):
            class_match = re.search(r"\bc-gear-slot-([a-z-]+)\b", get_html_attr(tag_match.group(0), "class"))
            if class_match:
                slot_class = class_match.group(1)
                break
        if not slot_class:
            continue

        slot_name = EC_LEGACY_CSS_SLOT_TO_NS_SLOT.get(slot_class)
        if slot_class == "ring":
            slot_name = "LeftRing" if generic_ring_count == 0 else "RightRing"
            generic_ring_count += 1
        if not slot_name:
            continue

        item_name = parse_ec_item_name(block)
        if not item_name:
            continue
        entries.append(
            {
                "slot": slot_name,
                "ec_slot": slot_class.upper(),
                "item_name": item_name,
                "dyes": parse_ec_dyes(block),
                "icon": parse_ec_icon_id(block),
            }
        )
    return entries


def parse_ec_equipment(document: str) -> List[Dict[str, Any]]:
    section = extract_ec_divider_section(document, "Equipment")

    entries = []
    generic_ring_count = 0
    if section:
        for block in iter_div_blocks(section, ["list", "box"]):
            slot_match = re.search(
                r'(?is)<span\b[^>]*class="[^"]*\bgear-icon-box-slot-name\b[^"]*"[^>]*>(.*?)</span>',
                block,
            )
            if not slot_match:
                continue
            slot_label = text_from_html(slot_match.group(1))
            normalized_slot = normalize_ec_slot(slot_label)
            slot_name = EC_SLOT_TO_NS_SLOT.get(normalized_slot)
            if normalized_slot == "RING":
                slot_name = "LeftRing" if generic_ring_count == 0 else "RightRing"
                generic_ring_count += 1
            if not slot_name:
                continue

            item_name = parse_ec_item_name(block)
            if not item_name:
                continue
            entries.append(
                {
                    "slot": slot_name,
                    "ec_slot": slot_label,
                    "item_name": item_name,
                    "dyes": parse_ec_dyes(block),
                    "icon": parse_ec_icon_id(block),
                }
            )
    else:
        entries = parse_ec_legacy_equipment(document)

    if not entries:
        raise ValueError("未在页面中识别到投影信息")

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    entries.sort(key=lambda entry: order.get(entry["slot"], len(order)))
    return entries
