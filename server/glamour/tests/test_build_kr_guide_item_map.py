import tempfile
import unittest
from http.client import IncompleteRead
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from server.glamour.tools.build_kr_guide_item_map import (
    GuideItem,
    build_output_map,
    crawl_guide_pages,
    fetch_text,
    load_cached_pages,
    load_item_candidates_from_csv_text,
    parse_guide_item_page,
    resolve_guide_records,
    write_page_cache,
)


GUIDE_PAGE_HTML = """
<html>
  <body>
    <ul class="list_type">
      <li>
        <a href="/lodestone/db/item/5398978e726">
          <div class="area1">
            <img src="//image.ff14.co.kr/guide/resources/images/GV7.5/030000/030700.png" alt="" />
          </div>
          <div class="area2">
            <em class="type">무기 &gt; 한손검</em>
            <cite class="name txt_col3">
              그랜드 챔피언 언월도
              <span class="new">N</span>
            </cite>
            <dl><dt>아이템 레벨</dt><dd>795</dd></dl>
            <dl><dt>장비 레벨</dt><dd>100</dd></dl>
          </div>
        </a>
      </li>
      <li>
        <a href="/lodestone/db/item/abc123def45">
          <img src="//image.ff14.co.kr/guide/resources/images/GV7.5/030000/030702.png" alt="" />
          <cite class="name txt_col3">왕국황동 한손검</cite>
          <dl><dt>아이템 레벨</dt><dd>790</dd></dl>
          <dl><dt>장비 레벨</dt><dd>100</dd></dl>
        </a>
      </li>
    </ul>
  </body>
</html>
"""


ITEM_CSV = """key,0,1,2,3
#,Name,Icon,Level{Item},Level{Equip}
int32,str,Image,ItemLevel,uint16
49658,그랜드 챔피언 언월도,30700,795,100
100,같은 이름,40000,10,1
101,같은 이름,40000,20,1
200,구분 불가,50000,30,5
201,구분 불가,50000,30,5
"""


class ParseGuideItemPageTests(unittest.TestCase):
    def test_parses_hash_icon_levels_and_excludes_nested_new_badge(self):
        records = parse_guide_item_page(GUIDE_PAGE_HTML)

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].hash_id, "5398978e726")
        self.assertEqual(records[0].name, "그랜드 챔피언 언월도")
        self.assertEqual(records[0].icon, 30700)
        self.assertEqual(records[0].item_level, 795)
        self.assertEqual(records[0].equip_level, 100)
        self.assertEqual(records[0].category, "무기 > 한손검")

    def test_rejects_html_without_the_item_result_list(self):
        with self.assertRaisesRegex(ValueError, "item result list"):
            parse_guide_item_page("<html><body>maintenance</body></html>")


class ResolveGuideRecordsTests(unittest.TestCase):
    def test_resolves_unique_pairs_and_uses_levels_to_break_pair_collisions(self):
        candidates = load_item_candidates_from_csv_text(ITEM_CSV)
        guide_records = [
            GuideItem("5398978e726", "그랜드 챔피언 언월도", 30700, 795, 100, "무기 > 한손검"),
            GuideItem("11111111111", "같은 이름", 40000, 20, 1, ""),
            GuideItem("22222222222", "없는 이름", 60000, 1, 1, ""),
            GuideItem("33333333333", "구분 불가", 50000, 30, 5, ""),
        ]

        result = resolve_guide_records(guide_records, candidates)

        self.assertEqual(result.mapping[49658].hash_id, "5398978e726")
        self.assertEqual(result.mapping[101].hash_id, "11111111111")
        self.assertEqual([record.hash_id for record in result.unmatched], ["22222222222"])
        self.assertEqual(result.ambiguous[0].guide.hash_id, "33333333333")
        self.assertEqual(result.ambiguous[0].candidate_ids, [200, 201])

    def test_builds_item_id_map_in_the_administrator_file_shape(self):
        candidates = load_item_candidates_from_csv_text(ITEM_CSV)
        records = [GuideItem("5398978e726", "그랜드 챔피언 언월도", 30700, 795, 100, "")]

        result = resolve_guide_records(records, candidates)

        self.assertEqual(
            build_output_map(result.mapping),
            {"49658": {"id": "5398978e726", "name": "그랜드 챔피언 언월도"}},
        )


class PageCacheTests(unittest.TestCase):
    def test_resumes_at_the_first_uncached_page_and_detects_a_short_last_page(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            cache_dir = Path(temporary_directory)
            first_page = [
                GuideItem("11111111111", "첫째", 1, 1, 1, ""),
                GuideItem("22222222222", "둘째", 2, 1, 1, ""),
            ]
            write_page_cache(cache_dir, 1, first_page)

            cached = load_cached_pages(cache_dir, page_size=2)
            self.assertEqual(cached.next_page, 2)
            self.assertFalse(cached.complete)
            self.assertEqual(len(cached.records), 2)

            write_page_cache(
                cache_dir,
                2,
                [GuideItem("33333333333", "셋째", 3, 1, 1, "")],
            )
            cached = load_cached_pages(cache_dir, page_size=2)
            self.assertEqual(cached.next_page, 3)
            self.assertTrue(cached.complete)
            self.assertEqual(len(cached.records), 3)

    def test_deduplicates_unstable_page_boundaries_and_marks_the_cache_incomplete(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            cache_dir = Path(temporary_directory)
            write_page_cache(
                cache_dir,
                1,
                [
                    GuideItem("11111111111", "첫째", 1, 1, 1, ""),
                    GuideItem("22222222222", "둘째", 2, 1, 1, ""),
                ],
            )
            write_page_cache(
                cache_dir,
                2,
                [GuideItem("22222222222", "둘째", 2, 1, 1, "")],
            )

            cached = load_cached_pages(cache_dir, page_size=2)

            self.assertFalse(cached.complete)
            self.assertEqual(cached.next_page, 1)
            self.assertEqual(cached.expected_total, 3)
            self.assertEqual(cached.duplicate_count, 1)
            self.assertEqual(
                [record.hash_id for record in cached.records],
                ["11111111111", "22222222222"],
            )


class CrawlBoundaryTests(unittest.TestCase):
    def test_fetch_retries_incomplete_http_reads(self):
        attempts = []
        waits = []

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_value, traceback):
                return False

            def read(self):
                attempts.append(True)
                if len(attempts) == 1:
                    raise IncompleteRead(b"partial", 100)
                return "完整".encode("utf-8")

        def fake_open(request, timeout):
            return FakeResponse()

        self.assertEqual(
            fetch_text(
                "https://example.invalid/items?page=1",
                max_retries=1,
                retry_base_seconds=0.1,
                open_url=fake_open,
                sleep_fn=waits.append,
            ),
            "完整",
        )
        self.assertEqual(attempts, [True, True])
        self.assertEqual(waits, [0.1])

    def test_fetch_retries_transient_failures_with_exponential_waits(self):
        attempts = []
        waits = []

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_value, traceback):
                return False

            def read(self):
                return "정상".encode("utf-8")

        def fake_open(request, timeout):
            attempts.append((request.full_url, timeout, request.get_header("User-agent")))
            if len(attempts) < 3:
                raise OSError("temporary failure")
            return FakeResponse()

        text = fetch_text(
            "https://example.invalid/items?page=1",
            timeout_seconds=12,
            max_retries=2,
            retry_base_seconds=1.5,
            open_url=fake_open,
            sleep_fn=waits.append,
        )

        self.assertEqual(text, "정상")
        self.assertEqual(len(attempts), 3)
        self.assertEqual([attempt[1] for attempt in attempts], [12, 12, 12])
        self.assertTrue(all("NightingaleSilence" in attempt[2] for attempt in attempts))
        self.assertEqual(waits, [1.5, 3.0])

    def test_crawl_is_serial_waits_between_pages_and_reuses_complete_cache(self):
        pages = {
            1: GUIDE_PAGE_HTML,
            2: """
                <ul class="list_type">
                  <li><a href="/lodestone/db/item/def456abc78">
                    <img src="//image.ff14.co.kr/guide/resources/images/000000/000003.png" alt="" />
                    <cite class="name">마지막</cite>
                  </a></li>
                </ul>
            """,
        }
        calls = []
        waits = []

        def fetch_page(page):
            calls.append(page)
            return pages[page]

        with tempfile.TemporaryDirectory() as temporary_directory:
            cache_dir = Path(temporary_directory)
            crawled = crawl_guide_pages(
                cache_dir,
                fetch_page,
                page_size=2,
                max_pages=10,
                delay_seconds=2.5,
                sleep_fn=waits.append,
            )

            self.assertTrue(crawled.complete)
            self.assertEqual(len(crawled.records), 3)
            self.assertEqual(calls, [1, 2])
            self.assertEqual(waits, [2.5])

            calls.clear()
            waits.clear()
            resumed = crawl_guide_pages(
                cache_dir,
                fetch_page,
                page_size=2,
                max_pages=10,
                delay_seconds=2.5,
                sleep_fn=waits.append,
            )
            self.assertTrue(resumed.complete)
            self.assertEqual(len(resumed.records), 3)
            self.assertEqual(calls, [])
            self.assertEqual(waits, [])

    def test_rescans_until_boundary_drift_recovers_the_expected_unique_count(self):
        scans = {
            1: [
                """
                    <ul class="list_type">
                      <li><a href="/lodestone/db/item/11111111111">
                        <img src="/000001.png" /><cite class="name">첫째</cite>
                      </a></li>
                      <li><a href="/lodestone/db/item/22222222222">
                        <img src="/000002.png" /><cite class="name">둘째</cite>
                      </a></li>
                    </ul>
                """,
                """
                    <ul class="list_type">
                      <li><a href="/lodestone/db/item/11111111111">
                        <img src="/000001.png" /><cite class="name">첫째</cite>
                      </a></li>
                      <li><a href="/lodestone/db/item/33333333333">
                        <img src="/000003.png" /><cite class="name">셋째</cite>
                      </a></li>
                    </ul>
                """,
            ],
            2: [
                """
                    <ul class="list_type">
                      <li><a href="/lodestone/db/item/22222222222">
                        <img src="/000002.png" /><cite class="name">둘째</cite>
                      </a></li>
                    </ul>
                """
            ],
        }
        page_calls = []

        def fetch_page(page):
            page_calls.append(page)
            return scans[page].pop(0)

        with tempfile.TemporaryDirectory() as temporary_directory:
            cache_dir = Path(temporary_directory)
            crawled = crawl_guide_pages(
                cache_dir,
                fetch_page,
                page_size=2,
                max_pages=10,
                delay_seconds=0,
                max_scans=3,
            )

            self.assertTrue(crawled.complete)
            self.assertEqual(crawled.expected_total, 3)
            self.assertEqual(crawled.scan_count, 2)
            self.assertEqual(crawled.duplicate_count, 2)
            self.assertEqual(page_calls, [1, 2, 1])
            self.assertEqual(
                {record.hash_id for record in crawled.records},
                {"11111111111", "22222222222", "33333333333"},
            )

            page_calls.clear()
            resumed = crawl_guide_pages(
                cache_dir,
                fetch_page,
                page_size=2,
                max_pages=10,
                delay_seconds=0,
                max_scans=3,
            )
            self.assertTrue(resumed.complete)
            self.assertEqual(page_calls, [])


if __name__ == "__main__":
    unittest.main()
