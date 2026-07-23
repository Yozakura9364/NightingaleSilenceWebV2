import subprocess
import sys
from pathlib import Path


def main() -> int:
    tests_dir = Path(__file__).resolve().parent
    test_files = sorted(tests_dir.glob("test_*.py"))
    for test_file in test_files:
        print(f"RUN {test_file.name}", flush=True)
        result = subprocess.run([sys.executable, str(test_file)], check=False)
        if result.returncode:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
