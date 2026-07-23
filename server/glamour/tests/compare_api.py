import argparse
import json
import urllib.parse
import urllib.request


GET_CASES = [
    ("health", {}),
    ("ui-localization", {}),
    ("stains", {"locale": "zh"}),
    ("stains", {"locale": "en"}),
    ("search-items", {"slot": "Body", "q": "长袍", "locale": "zh", "limit": "5"}),
    ("search-items", {"slot": "Body", "q": "robe", "locale": "en", "limit": "5"}),
]
POST_CASES = [
    (
        "equipinfo/parse-text",
        {"text": "Body: Robe of Divine Death", "source_locale": "en"},
    )
]


def request_json(base_url: str, path: str, query=None, body=None):
    url = f"{base_url.rstrip('/')}/{path}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data else {},
        method="POST" if data else "GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare old and V2 NSGlamour API responses")
    parser.add_argument("--old", default="http://127.0.0.1:8765/api")
    parser.add_argument("--new", default="http://127.0.0.1:8766/api")
    args = parser.parse_args()

    failures = []
    for path, query in GET_CASES:
        old = request_json(args.old, path, query=query)
        new = request_json(args.new, path, query=query)
        if old != new:
            failures.append(f"GET {path} {query}")

    for path, body in POST_CASES:
        old = request_json(args.old, path, body=body)
        new = request_json(args.new, path, body=body)
        if old != new:
            failures.append(f"POST {path}")

    if failures:
        print("API response mismatch:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"API parity ok: {len(GET_CASES) + len(POST_CASES)} cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
