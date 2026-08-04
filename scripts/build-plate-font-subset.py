# -*- coding: utf-8 -*-
"""构建 NSPlate Adobe Heiti Std 字体子集。

原字体 src/assets/fonts/plate/AdobeHeitiStdR.woff2 约 9.4MB（3 万字形全量 GBK），
而 NSPlate 信息层实际只需要：ASCII、GB2312 字符集（含符号/假名/希腊字母/6763 个汉字）、
以及 plate 数据与默认文案中出现的少量额外字符。

子集输出为 AdobeHeitiStdR-subset.woff2，原字体文件保持不变。
画布渲染遇到子集外字符（如极生僻的角色名用字）会按浏览器规则回退到系统字体。

用法：
    python scripts/build-plate-font-subset.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_FONT = ROOT / 'src/assets/fonts/plate/AdobeHeitiStdR.woff2'
OUTPUT_FONT = ROOT / 'src/assets/fonts/plate/AdobeHeitiStdR-subset.woff2'
CHARSET_FILE = ROOT / 'scripts/.plate-font-subset-charset.txt'

# 需要扫描额外字符的数据/文案目录
EXTRA_TEXT_GLOBS = [
    'public/data/plate/**/*.json',
    'src/lib/plate/**/*.ts',
]


def gb2312_chars() -> set[str]:
    chars: set[str] = set()
    for lead in range(0xA1, 0xF8):
        for trail in range(0xA1, 0xFF):
            try:
                chars.add(bytes([lead, trail]).decode('gb2312'))
            except UnicodeDecodeError:
                continue
    return chars


def ascii_chars() -> set[str]:
    return {chr(code) for code in range(0x20, 0x7F)}


def extra_text_chars() -> set[str]:
    chars: set[str] = set()
    for pattern in EXTRA_TEXT_GLOBS:
        for path in sorted(ROOT.glob(pattern)):
            try:
                text = path.read_text(encoding='utf-8')
            except (OSError, UnicodeDecodeError):
                continue
            if path.suffix == '.json':
                try:
                    text = json.dumps(json.loads(text), ensure_ascii=False)
                except ValueError:
                    pass
            chars.update(re.findall(r'[^\x00-\x7F]', text))
    return chars


def main() -> int:
    if not SOURCE_FONT.exists():
        print(f'源字体不存在: {SOURCE_FONT}', file=sys.stderr)
        return 1

    charset = ascii_chars() | gb2312_chars() | extra_text_chars()
    CHARSET_FILE.write_text(''.join(sorted(charset)), encoding='utf-8')
    print(f'字符集大小: {len(charset)}')

    cmd = [
        sys.executable,
        '-m',
        'fontTools.subset',
        str(SOURCE_FONT),
        f'--text-file={CHARSET_FILE}',
        '--flavor=woff2',
        f'--output-file={OUTPUT_FONT}',
        '--name-IDs=*',
        '--name-languages=*',
        '--layout-features=*',
    ]
    subprocess.run(cmd, check=True)

    source_kb = SOURCE_FONT.stat().st_size / 1024
    output_kb = OUTPUT_FONT.stat().st_size / 1024
    print(f'{SOURCE_FONT.name}: {source_kb:.0f} KB -> {OUTPUT_FONT.name}: {output_kb:.0f} KB')

    CHARSET_FILE.unlink(missing_ok=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
