"""纯文本归一化工具：抓取、导入解析与搜索共用的叶子模块。"""

import html
import re
from typing import List


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def clean_datamining_text(value: str) -> str:
    text = str(value or "")
    text = re.sub(r"<(?:SoftHyphen|Indent)\s*/>", "", text, flags=re.IGNORECASE)
    return text


def normalize_lookup_text(value: str) -> str:
    text = html.unescape(clean_datamining_text(value))
    text = text.replace("’", "'").replace("`", "'")
    text = re.sub(r"\s+", " ", text).strip().casefold()
    return text


def text_from_html(fragment: str) -> str:
    cleaned = re.sub(r"(?is)<(?:script|style)\b.*?</(?:script|style)>", " ", fragment)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    return normalize_space(html.unescape(cleaned))


def get_html_attr(tag: str, attr_name: str) -> str:
    pattern = re.compile(
        rf"""\b{re.escape(attr_name)}\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))""",
        re.IGNORECASE,
    )
    match = pattern.search(tag)
    if not match:
        return ""
    return html.unescape(next((group for group in match.groups() if group is not None), ""))


def html_tag_has_classes(tag: str, required_classes: List[str]) -> bool:
    classes = set(get_html_attr(tag, "class").split())
    return all(class_name in classes for class_name in required_classes)


def iter_div_blocks(fragment: str, required_classes: List[str]):
    position = 0
    open_div_pattern = re.compile(r"<div\b[^>]*>", re.IGNORECASE)
    div_pattern = re.compile(r"</?div\b[^>]*>", re.IGNORECASE)

    while position < len(fragment):
        match = open_div_pattern.search(fragment, position)
        if not match:
            return
        if not html_tag_has_classes(match.group(0), required_classes):
            position = match.end()
            continue

        depth = 0
        for div_match in div_pattern.finditer(fragment, match.start()):
            if div_match.group(0).lower().startswith("</"):
                depth -= 1
            else:
                depth += 1
            if depth == 0:
                yield fragment[match.start() : div_match.end()]
                position = div_match.end()
                break
        else:
            return


def normalize_text_input_lookup(value: str) -> str:
    text = normalize_lookup_text(value)
    text = re.sub(r"[‐‑‒–—―\-－_＿·・•◆◇★☆※#＃]+", " ", text)
    text = re.sub(r"[\"“”'‘’`´]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def compact_text_input_lookup(value: str) -> str:
    return re.sub(r"\s+", "", normalize_text_input_lookup(value))
