from __future__ import annotations

import argparse
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import local
from typing import Iterable

import pandas as pd
import requests


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT_DIR / "data" / "balanced_df.csv"
DEFAULT_OUTPUT_DIR = ROOT_DIR / "data" / "balanced_images"
DEFAULT_FAILURES_CSV = ROOT_DIR / "data" / "balanced_images_failures.csv"

_thread_state = local()


def get_session() -> requests.Session:
    session = getattr(_thread_state, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "StyleSync image downloader"})
        _thread_state.session = session
    return session


def download_one(row: dict, output_dir: Path, timeout: float) -> tuple[str, int, str]:
    image_id = str(row["id"])
    url = str(row["link"])
    output_path = output_dir / f"{image_id}.jpg"

    if output_path.exists():
        return ("skipped", int(image_id), "already exists")

    try:
        response = get_session().get(url, timeout=timeout)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        return ("downloaded", int(image_id), "")
    except Exception as exc:  # noqa: BLE001
        return ("failed", int(image_id), f"{type(exc).__name__}: {exc}")


def iter_rows(csv_path: Path) -> Iterable[dict]:
    df = pd.read_csv(csv_path)
    required_columns = {"id", "link"}
    missing = required_columns.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in {csv_path}: {sorted(missing)}")
    return df[["id", "link"]].to_dict("records")


def write_failures(failures: list[tuple[int, str, str]], failures_csv: Path) -> None:
    with failures_csv.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["id", "link", "error"])
        for image_id, url, error in failures:
            writer.writerow([image_id, url, error])


def main() -> None:
    parser = argparse.ArgumentParser(description="Download balanced_df images locally.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Path to balanced_df.csv")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Folder where downloaded images will be saved",
    )
    parser.add_argument(
        "--failures-csv",
        type=Path,
        default=DEFAULT_FAILURES_CSV,
        help="Where to write failed downloads for retry",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=12,
        help="Number of parallel download workers",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="Per-request timeout in seconds",
    )
    args = parser.parse_args()

    csv_path = args.csv.resolve()
    output_dir = args.output_dir.resolve()
    failures_csv = args.failures_csv.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    rows = list(iter_rows(csv_path))
    total = len(rows)
    downloaded = 0
    skipped = 0
    failures: list[tuple[int, str, str]] = []

    print(f"Downloading {total} images from {csv_path}")
    print(f"Saving images to {output_dir}")

    with ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        future_to_row = {
            executor.submit(download_one, row, output_dir, args.timeout): row for row in rows
        }

        for index, future in enumerate(as_completed(future_to_row), start=1):
            row = future_to_row[future]
            status, image_id, info = future.result()

            if status == "downloaded":
                downloaded += 1
            elif status == "skipped":
                skipped += 1
            else:
                failures.append((image_id, str(row["link"]), info))

            if index % 50 == 0 or index == total:
                print(
                    f"{index}/{total} processed | "
                    f"downloaded={downloaded} skipped={skipped} failed={len(failures)}"
                )

    write_failures(failures, failures_csv)
    print("Done.")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {len(failures)}")
    print(f"Failures CSV: {failures_csv}")


if __name__ == "__main__":
    main()
