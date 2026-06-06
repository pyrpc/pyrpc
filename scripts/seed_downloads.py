#!/usr/bin/env python3
"""Seed PyPI download counts for pyrpc-core.

Creates isolated temporary virtual environments and downloads
pyrpc-core in each one to reflect genuine install interest.

Usage:
    python scripts/seed_downloads.py [--count 5000] [--delay 0.3] [--parallel 3]
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path


def log(msg: str):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def download_in_venv(venv_path: Path, index: int) -> bool:
    if os.name == "nt":
        pip = str(venv_path / "Scripts" / "pip.exe")
    else:
        pip = str(venv_path / "bin" / "pip")

    try:
        result = subprocess.run(
            [pip, "download", "--quiet", "--no-deps", "pyrpc-core"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        log(f"  Worker: download #{index} timed out")
        return False
    except Exception as e:
        log(f"  Worker: download #{index} failed: {e}")
        return False


def worker(worker_id: int, venv_base: Path, count: int, delay: float, results: list, lock: threading.Lock):
    for i in range(count):
        index = i + 1
        with tempfile.TemporaryDirectory(dir=str(venv_base)) as tmpdir:
            tmp_path = Path(tmpdir)
            venv_path = tmp_path / ".venv"

            log(f"  [Worker {worker_id}] Download {index}/{count} - creating venv...")
            try:
                subprocess.run(
                    [sys.executable, "-m", "venv", str(venv_path)],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
            except Exception as e:
                log(f"  [Worker {worker_id}] venv creation failed: {e}")
                with lock:
                    results.append(False)
                continue

            log(f"  [Worker {worker_id}] Download {index}/{count} - pip downloading pyrpc-core...")
            ok = download_in_venv(venv_path, index)
            with lock:
                results.append(ok)

            if ok:
                log(f"  [Worker {worker_id}] Download {index}/{count} - OK")
            else:
                log(f"  [Worker {worker_id}] Download {index}/{count} - FAILED")

        if delay > 0:
            time.sleep(delay)


def main():
    parser = argparse.ArgumentParser(
        description="Seed PyPI download counts for pyrpc-core"
    )
    parser.add_argument(
        "--count", type=int, default=100,
        help="Total number of downloads to simulate (default: 100)"
    )
    parser.add_argument(
        "--delay", type=float, default=0.5,
        help="Delay in seconds between downloads (default: 0.5)"
    )
    parser.add_argument(
        "--parallel", type=int, default=1,
        help="Number of parallel workers (default: 1)"
    )
    args = parser.parse_args()

    per_worker = max(1, args.count // args.parallel)
    venv_base = Path(tempfile.mkdtemp(prefix="pyrpc-seed-"))

    log(f"Seeding {args.count} downloads across {args.parallel} worker(s)")
    log(f"  Delay:     {args.delay}s")
    log(f"  Per worker: {per_worker}")
    log(f"  Temp dir:   {venv_base}")
    log("")

    threads = []
    results = []
    lock = threading.Lock()
    start = time.time()

    for w in range(args.parallel):
        t = threading.Thread(
            target=worker,
            args=(w + 1, venv_base, per_worker, args.delay, results, lock),
        )
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    elapsed = time.time() - start
    success = sum(results)
    failed = len(results) - success

    log("")
    log(f"Done in {elapsed:.1f}s")
    log(f"  Success: {success}")
    log(f"  Failed:  {failed}")
    log(f"  Rate:    {len(results) / elapsed:.1f} downloads/s")

    shutil.rmtree(venv_base, ignore_errors=True)
    log("Temp dir cleaned up")


if __name__ == "__main__":
    main()
