import argparse
import csv
from http.client import IncompleteRead
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Tuple


ITEM_PATH_RE = re.compile(r"^/lodestone/db/item/([0-9a-f]{11})/?$", re.IGNORECASE)
ICON_PATH_RE = re.compile(r"/(\d+)\.png(?:\?.*)?$", re.IGNORECASE)
WHITESPACE_RE = re.compile(r"\s+")
PAGE_CACHE_VERSION = 1
CRAWL_STATE_VERSION = 1
CRAWL_STATE_FILENAME = "crawl-state.json"
PAGE_SIZE = 30
DEFAULT_BASE_URL = "https://guide.ff14.co.kr/lodestone/db/item"
DEFAULT_KO_ITEM_CSV = (
    "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/"
    "master/csv/Item.csv"
)
USER_AGENT = "NightingaleSilence KR guide item map builder/1.0"
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CACHE_DIR = (
    REPOSITORY_ROOT / "server" / "glamour" / ".runtime" / "kr-guide-item-pages"
)
DEFAULT_OUTPUT = REPOSITORY_ROOT / "public" / "data" / "ffxiv" / "kr-guide-id-map.json"
DEFAULT_REPORT = (
    REPOSITORY_ROOT / "server" / "glamour" / ".runtime" / "kr-guide-item-map-report.json"
)
KNOWN_ITEM_HASHES = {49658: "5398978e726"}


@dataclass(frozen=True)
class GuideItem:
    hash_id: str
    name: str
    icon: int
    item_level: int
    equip_level: int
    category: str


@dataclass(frozen=True)
class ItemCandidate:
    item_id: int
    name: str
    icon: int
    item_level: int
    equip_level: int


@dataclass(frozen=True)
class AmbiguousMatch:
    guide: GuideItem
    candidate_ids: List[int]


@dataclass
class ResolutionResult:
    mapping: Dict[int, GuideItem]
    unmatched: List[GuideItem]
    ambiguous: List[AmbiguousMatch]


@dataclass
class CachedPages:
    records: List[GuideItem]
    next_page: int
    complete: bool
    page_count: int = 0
    expected_total: int = 0
    scan_count: int = 1
    duplicate_count: int = 0


def normalize_text(value: str) -> str:
    return WHITESPACE_RE.sub(" ", str(value or "")).strip()


def parse_int(value: str) -> int:
    try:
        return int(str(value or "").strip())
    except ValueError:
        return 0


class _GuideItemListParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.records: List[GuideItem] = []
        self.saw_result_list = False
        self.current: Optional[Dict[str, object]] = None
        self.name_depth = 0
        self.category_depth = 0
        self.term_depth = 0
        self.value_depth = 0
        self.name_parts: List[str] = []
        self.category_parts: List[str] = []
        self.term_parts: List[str] = []
        self.value_parts: List[str] = []
        self.pending_term = ""

    def handle_starttag(
        self, tag: str, attrs: List[Tuple[str, Optional[str]]]
    ) -> None:
        tag = tag.lower()
        attributes = {key.lower(): value or "" for key, value in attrs}
        classes = set(attributes.get("class", "").split())

        if tag == "ul" and "list_type" in classes:
            self.saw_result_list = True

        if self.current is not None and tag not in {"img", "br", "hr", "input", "meta", "link"}:
            self._descend_captures()

        if tag == "a" and self.current is None:
            match = ITEM_PATH_RE.match(attributes.get("href", ""))
            if match:
                self.current = {
                    "hash_id": match.group(1).lower(),
                    "icon": 0,
                    "item_level": 0,
                    "equip_level": 0,
                }
                self._reset_capture_state()
                return

        if self.current is None:
            return

        if tag == "img" and not self.current.get("icon"):
            icon_match = ICON_PATH_RE.search(attributes.get("src", ""))
            if icon_match:
                self.current["icon"] = int(icon_match.group(1))
        elif tag == "cite" and "name" in classes:
            self.name_depth = 1
            self.name_parts = []
        elif tag == "em" and "type" in classes:
            self.category_depth = 1
            self.category_parts = []
        elif tag == "dt":
            self.term_depth = 1
            self.term_parts = []
        elif tag == "dd":
            self.value_depth = 1
            self.value_parts = []

    def handle_startendtag(
        self, tag: str, attrs: List[Tuple[str, Optional[str]]]
    ) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        if self.current is None:
            return
        if self.name_depth == 1:
            self.name_parts.append(data)
        if self.category_depth == 1:
            self.category_parts.append(data)
        if self.term_depth == 1:
            self.term_parts.append(data)
        if self.value_depth == 1:
            self.value_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.current is None:
            return

        if tag == "a":
            self._finish_current()
            return
        if tag == "cite" and self.name_depth == 1:
            self.current["name"] = normalize_text("".join(self.name_parts))
        elif tag == "em" and self.category_depth == 1:
            self.current["category"] = normalize_text("".join(self.category_parts))
        elif tag == "dt" and self.term_depth == 1:
            self.pending_term = normalize_text("".join(self.term_parts))
        elif tag == "dd" and self.value_depth == 1:
            self._apply_definition_value()

        self._ascend_captures()

    def _descend_captures(self) -> None:
        if self.name_depth:
            self.name_depth += 1
        if self.category_depth:
            self.category_depth += 1
        if self.term_depth:
            self.term_depth += 1
        if self.value_depth:
            self.value_depth += 1

    def _ascend_captures(self) -> None:
        if self.name_depth:
            self.name_depth -= 1
        if self.category_depth:
            self.category_depth -= 1
        if self.term_depth:
            self.term_depth -= 1
        if self.value_depth:
            self.value_depth -= 1

    def _reset_capture_state(self) -> None:
        self.name_depth = 0
        self.category_depth = 0
        self.term_depth = 0
        self.value_depth = 0
        self.name_parts = []
        self.category_parts = []
        self.term_parts = []
        self.value_parts = []
        self.pending_term = ""

    def _apply_definition_value(self) -> None:
        value = parse_int(normalize_text("".join(self.value_parts)))
        if self.pending_term == "아이템 레벨":
            self.current["item_level"] = value
        elif self.pending_term == "장비 레벨":
            self.current["equip_level"] = value
        self.pending_term = ""

    def _finish_current(self) -> None:
        record = GuideItem(
            hash_id=str(self.current.get("hash_id", "")),
            name=normalize_text(str(self.current.get("name", ""))),
            icon=int(self.current.get("icon", 0) or 0),
            item_level=int(self.current.get("item_level", 0) or 0),
            equip_level=int(self.current.get("equip_level", 0) or 0),
            category=normalize_text(str(self.current.get("category", ""))),
        )
        if record.name and record.icon > 0:
            self.records.append(record)
        self.current = None
        self._reset_capture_state()


def parse_guide_item_page(html: str) -> List[GuideItem]:
    parser = _GuideItemListParser()
    parser.feed(html)
    parser.close()
    if not parser.saw_result_list:
        raise ValueError("KR guide HTML does not contain the item result list")

    hashes = [record.hash_id for record in parser.records]
    if len(hashes) != len(set(hashes)):
        raise ValueError("KR guide page contains duplicate item hashes")
    return parser.records


def _sheet_rows_from_text(text: str) -> Iterable[Dict[str, str]]:
    rows = list(csv.reader(io.StringIO(text)))
    if len(rows) < 4:
        raise ValueError("Korean Item.csv content is too short")
    headers = [value.lstrip("\ufeff").strip() for value in rows[1]]
    for raw_row in rows[3:]:
        if not raw_row:
            continue
        values = raw_row[: len(headers)] + [""] * max(0, len(headers) - len(raw_row))
        yield dict(zip(headers, values))


def load_item_candidates_from_csv_text(text: str) -> List[ItemCandidate]:
    candidates: List[ItemCandidate] = []
    for row in _sheet_rows_from_text(text):
        item_id = parse_int(row.get("#", "0"))
        name = normalize_text(row.get("Name", ""))
        icon = parse_int(row.get("Icon", "0"))
        if item_id <= 0 or not name or icon <= 0:
            continue
        candidates.append(
            ItemCandidate(
                item_id=item_id,
                name=name,
                icon=icon,
                item_level=parse_int(row.get("Level{Item}", "0")),
                equip_level=parse_int(row.get("Level{Equip}", "0")),
            )
        )
    return candidates


def resolve_guide_records(
    guide_records: Iterable[GuideItem],
    candidates: Iterable[ItemCandidate],
) -> ResolutionResult:
    by_name_icon: Dict[tuple[str, int], List[ItemCandidate]] = defaultdict(list)
    for candidate in candidates:
        by_name_icon[(candidate.name, candidate.icon)].append(candidate)

    result = ResolutionResult(mapping={}, unmatched=[], ambiguous=[])
    for guide in guide_records:
        matches = list(by_name_icon.get((guide.name, guide.icon), []))
        if not matches:
            result.unmatched.append(guide)
            continue
        if len(matches) > 1 and guide.item_level > 0:
            level_matches = [item for item in matches if item.item_level == guide.item_level]
            if level_matches:
                matches = level_matches
        if len(matches) > 1 and guide.equip_level > 0:
            equip_matches = [item for item in matches if item.equip_level == guide.equip_level]
            if equip_matches:
                matches = equip_matches
        if len(matches) != 1:
            result.ambiguous.append(
                AmbiguousMatch(guide=guide, candidate_ids=sorted(item.item_id for item in matches))
            )
            continue

        item_id = matches[0].item_id
        existing = result.mapping.get(item_id)
        if existing and existing.hash_id != guide.hash_id:
            raise ValueError(
                f"Item ID {item_id} maps to multiple KR guide hashes: "
                f"{existing.hash_id}, {guide.hash_id}"
            )
        result.mapping[item_id] = guide
    return result


def build_output_map(mapping: Dict[int, GuideItem]) -> Dict[str, Dict[str, str]]:
    return {
        str(item_id): {"id": guide.hash_id, "name": guide.name}
        for item_id, guide in sorted(mapping.items())
    }


def _page_cache_path(cache_dir: Path, page: int) -> Path:
    return cache_dir / f"page-{page:05d}.json"


def write_page_cache(cache_dir: Path, page: int, records: Iterable[GuideItem]) -> Path:
    if page <= 0:
        raise ValueError("page must be positive")
    cache_dir.mkdir(parents=True, exist_ok=True)
    output_path = _page_cache_path(cache_dir, page)
    temporary_path = output_path.with_suffix(".json.tmp")
    payload = {
        "version": PAGE_CACHE_VERSION,
        "page": page,
        "items": [asdict(record) for record in records],
    }
    temporary_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(output_path)
    return output_path


def _read_page_cache(path: Path, expected_page: int) -> List[GuideItem]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("version") != PAGE_CACHE_VERSION or payload.get("page") != expected_page:
        raise ValueError(f"Invalid KR guide page cache: {path}")
    records = [GuideItem(**item) for item in payload.get("items", [])]
    for record in records:
        if not ITEM_PATH_RE.match(f"/lodestone/db/item/{record.hash_id}"):
            raise ValueError(f"Invalid KR guide hash in cache: {record.hash_id}")
    return records


def load_cached_pages(cache_dir: Path, page_size: int = 30) -> CachedPages:
    if page_size <= 0:
        raise ValueError("page_size must be positive")
    records: List[GuideItem] = []
    seen_hashes: set[str] = set()
    page = 1
    reached_last_page = False
    expected_total = 0
    duplicate_count = 0
    while True:
        cache_path = _page_cache_path(cache_dir, page)
        if not cache_path.is_file():
            break
        page_records = _read_page_cache(cache_path, page)
        for record in page_records:
            if record.hash_id in seen_hashes:
                duplicate_count += 1
                continue
            seen_hashes.add(record.hash_id)
            records.append(record)
        page += 1
        if len(page_records) < page_size:
            reached_last_page = True
            expected_total = (page - 2) * page_size + len(page_records)
            break

    complete = reached_last_page and len(records) >= expected_total
    return CachedPages(
        records=records,
        next_page=page if complete or not reached_last_page else 1,
        complete=complete,
        page_count=page - 1,
        expected_total=expected_total,
        scan_count=2 if reached_last_page and not complete else 1,
        duplicate_count=duplicate_count,
    )


def _crawl_state_path(cache_dir: Path) -> Path:
    return cache_dir / CRAWL_STATE_FILENAME


def _write_crawl_state(cache_dir: Path, crawl: CachedPages, page_size: int) -> None:
    payload = {
        "version": CRAWL_STATE_VERSION,
        "pageSize": page_size,
        "nextPage": crawl.next_page,
        "complete": crawl.complete,
        "pageCount": crawl.page_count,
        "expectedTotal": crawl.expected_total,
        "scanCount": crawl.scan_count,
        "duplicateCount": crawl.duplicate_count,
        "items": [asdict(record) for record in crawl.records],
    }
    _write_json_atomic(_crawl_state_path(cache_dir), payload)


def _read_crawl_state(cache_dir: Path, page_size: int) -> Optional[CachedPages]:
    state_path = _crawl_state_path(cache_dir)
    if not state_path.is_file():
        return None
    payload = json.loads(state_path.read_text(encoding="utf-8"))
    if (
        payload.get("version") != CRAWL_STATE_VERSION
        or payload.get("pageSize") != page_size
    ):
        raise ValueError(f"Invalid KR guide crawl state: {state_path}")
    records = [GuideItem(**item) for item in payload.get("items", [])]
    hashes = [record.hash_id for record in records]
    if len(hashes) != len(set(hashes)):
        raise ValueError(f"Duplicate hashes in KR guide crawl state: {state_path}")
    return CachedPages(
        records=records,
        next_page=int(payload.get("nextPage", 1)),
        complete=bool(payload.get("complete", False)),
        page_count=int(payload.get("pageCount", 0)),
        expected_total=int(payload.get("expectedTotal", 0)),
        scan_count=int(payload.get("scanCount", 1)),
        duplicate_count=int(payload.get("duplicateCount", 0)),
    )


def fetch_text(
    url: str,
    timeout_seconds: float = 30,
    max_retries: int = 4,
    retry_base_seconds: float = 3,
    open_url: Callable = urllib.request.urlopen,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> str:
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be positive")
    if max_retries < 0:
        raise ValueError("max_retries cannot be negative")
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
    )
    for attempt in range(max_retries + 1):
        try:
            with open_url(request, timeout=timeout_seconds) as response:
                return response.read().decode("utf-8-sig")
        except urllib.error.HTTPError as error:
            if error.code not in {408, 425, 429, 500, 502, 503, 504}:
                raise
            last_error = error
        except (IncompleteRead, OSError, TimeoutError) as error:
            last_error = error
        if attempt >= max_retries:
            raise last_error
        sleep_fn(retry_base_seconds * (2**attempt))
    raise RuntimeError("unreachable retry state")


def crawl_guide_pages(
    cache_dir: Path,
    fetch_page: Callable[[int], str],
    page_size: int = PAGE_SIZE,
    max_pages: int = 2500,
    max_scans: int = 20,
    delay_seconds: float = 3,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> CachedPages:
    if max_pages <= 0:
        raise ValueError("max_pages must be positive")
    if max_scans <= 0:
        raise ValueError("max_scans must be positive")
    if delay_seconds < 0:
        raise ValueError("delay_seconds cannot be negative")

    cached = _read_crawl_state(cache_dir, page_size) or load_cached_pages(
        cache_dir, page_size
    )
    if cached.complete:
        return cached

    records = list(cached.records)
    seen_hashes = {record.hash_id for record in records}
    page = cached.next_page
    page_count = cached.page_count
    expected_total = cached.expected_total
    scan_count = cached.scan_count
    duplicate_count = cached.duplicate_count
    while True:
        if page > max_pages:
            raise RuntimeError(
                f"KR guide crawl reached max_pages={max_pages} before finding the last page; "
                "cached pages and crawl state were kept for resume"
            )
        page_records = parse_guide_item_page(fetch_page(page))
        if len(page_records) > page_size:
            raise ValueError(
                f"KR guide page {page} contains {len(page_records)} items; expected at most {page_size}"
            )
        for record in page_records:
            if record.hash_id in seen_hashes:
                duplicate_count += 1
                continue
            seen_hashes.add(record.hash_id)
            records.append(record)
        if scan_count == 1:
            write_page_cache(cache_dir, page, page_records)

        fetched_page = page
        page += 1
        reached_last_page = len(page_records) < page_size
        if reached_last_page:
            page_count = fetched_page
            expected_total = (fetched_page - 1) * page_size + len(page_records)

        complete = expected_total > 0 and len(records) >= expected_total
        if complete:
            result = CachedPages(
                records=records,
                next_page=page,
                complete=True,
                page_count=page_count,
                expected_total=expected_total,
                scan_count=scan_count,
                duplicate_count=duplicate_count,
            )
            _write_crawl_state(cache_dir, result, page_size)
            return result

        if reached_last_page:
            scan_count += 1
            page = 1

        checkpoint = CachedPages(
            records=records,
            next_page=page,
            complete=False,
            page_count=page_count,
            expected_total=expected_total,
            scan_count=scan_count,
            duplicate_count=duplicate_count,
        )
        _write_crawl_state(cache_dir, checkpoint, page_size)
        if scan_count > max_scans:
            raise RuntimeError(
                f"KR guide crawl found {len(records)} of {expected_total} expected unique hashes "
                f"after {max_scans} scans; crawl state was kept for resume"
            )
        if delay_seconds:
            sleep_fn(delay_seconds)


def read_source_text(source: str) -> str:
    if source.startswith(("http://", "https://")):
        return fetch_text(source)
    return Path(source).read_text(encoding="utf-8-sig")


def _write_json_atomic(path: Path, payload: object, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(path.suffix + ".tmp")
    if compact:
        serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    else:
        serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    temporary_path.write_text(serialized, encoding="utf-8")
    temporary_path.replace(path)


def _build_report(
    records: List[GuideItem],
    resolution: ResolutionResult,
    pages: int,
    item_csv: str,
    expected_total: int = 0,
    scan_count: int = 1,
    duplicate_count: int = 0,
) -> Dict[str, object]:
    matched = len(resolution.mapping)
    total = len(records)
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": DEFAULT_BASE_URL,
        "itemCsv": item_csv,
        "pages": pages,
        "expectedTotal": expected_total,
        "scans": scan_count,
        "duplicatesSkipped": duplicate_count,
        "crawled": total,
        "matched": matched,
        "matchRate": matched / total if total else 0,
        "unmatched": [asdict(record) for record in resolution.unmatched],
        "ambiguous": [
            {"guide": asdict(match.guide), "candidateIds": match.candidate_ids}
            for match in resolution.ambiguous
        ],
    }


def _positive_delay(value: str) -> float:
    parsed = float(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("delay must be at least 1 second")
    return parsed


def _match_rate(value: str) -> float:
    parsed = float(value)
    if not 0 <= parsed <= 1:
        raise argparse.ArgumentTypeError("minimum match rate must be between 0 and 1")
    return parsed


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(
        description="Build an Item ID to Korean official guide hash map with resumable serial crawling"
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--item-csv", default=DEFAULT_KO_ITEM_CSV)
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--report-output", default=str(DEFAULT_REPORT))
    parser.add_argument("--delay-seconds", type=_positive_delay, default=3.0)
    parser.add_argument("--timeout-seconds", type=float, default=30.0)
    parser.add_argument("--max-retries", type=int, default=4)
    parser.add_argument("--retry-base-seconds", type=float, default=3.0)
    parser.add_argument("--max-pages", type=int, default=2500)
    parser.add_argument("--max-scans", type=int, default=20)
    parser.add_argument("--minimum-match-rate", type=_match_rate, default=0.95)
    args = parser.parse_args()

    cache_dir = Path(args.cache_dir)
    output_path = Path(args.output)
    report_path = Path(args.report_output)
    base_url = args.base_url.rstrip("/")

    def fetch_page(page: int) -> str:
        separator = "&" if "?" in base_url else "?"
        return fetch_text(
            f"{base_url}{separator}page={page}",
            timeout_seconds=args.timeout_seconds,
            max_retries=args.max_retries,
            retry_base_seconds=args.retry_base_seconds,
        )

    try:
        crawl = crawl_guide_pages(
            cache_dir,
            fetch_page,
            max_pages=args.max_pages,
            max_scans=args.max_scans,
            delay_seconds=args.delay_seconds,
        )
        candidates = load_item_candidates_from_csv_text(read_source_text(args.item_csv))
        resolution = resolve_guide_records(crawl.records, candidates)
        report = _build_report(
            crawl.records,
            resolution,
            crawl.page_count,
            args.item_csv,
            expected_total=crawl.expected_total,
            scan_count=crawl.scan_count,
            duplicate_count=crawl.duplicate_count,
        )
        _write_json_atomic(report_path, report)
        if not crawl.records:
            raise ValueError("KR guide crawl completed without item records")
        if report["matchRate"] < args.minimum_match_rate:
            raise ValueError(
                f"KR guide match rate {report['matchRate']:.2%} is below "
                f"the required {args.minimum_match_rate:.2%}"
            )

        output = build_output_map(resolution.mapping)
        for item_id, expected_hash in KNOWN_ITEM_HASHES.items():
            actual = output.get(str(item_id), {}).get("id")
            if actual != expected_hash:
                raise ValueError(
                    f"Known KR guide sample {item_id} expected {expected_hash}, got {actual or 'missing'}"
                )
        _write_json_atomic(output_path, output, compact=True)
    except Exception as error:
        print(f"Error building KR guide item map: {error}", file=sys.stderr)
        return 1

    summary = {
        "output": str(output_path.resolve()),
        "report": str(report_path.resolve()),
        "cacheDir": str(cache_dir.resolve()),
        "pages": report["pages"],
        "expectedTotal": report["expectedTotal"],
        "scans": report["scans"],
        "duplicatesSkipped": report["duplicatesSkipped"],
        "crawled": report["crawled"],
        "matched": report["matched"],
        "matchRate": report["matchRate"],
        "unmatched": len(report["unmatched"]),
        "ambiguous": len(report["ambiguous"]),
    }
    json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
