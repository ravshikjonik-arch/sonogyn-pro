#!/usr/bin/env python3
"""Soft Ragas gate: schema check always; full metrics only if RAGAS_RUN=1 and API key set."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIXTURE = ROOT / "fixtures" / "sample_ragas.json"


def main() -> int:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    samples = data.get("samples") or []
    if len(samples) < 1:
        print("FAIL: no samples", file=sys.stderr)
        return 1
    for i, row in enumerate(samples):
        for key in ("question", "contexts", "answer"):
            if key not in row:
                print(f"FAIL sample[{i}] missing {key}", file=sys.stderr)
                return 1
        if not isinstance(row["contexts"], list):
            print(f"FAIL sample[{i}] contexts must be list", file=sys.stderr)
            return 1
        if not row["contexts"] and "недостаточно" not in row["answer"].lower() and "insufficient" not in row["answer"].lower():
            print(
                f"WARN sample[{i}]: empty contexts should answer insufficient (soft)",
                file=sys.stderr,
            )

    if os.environ.get("RAGAS_RUN", "").strip() != "1":
        print(f"ok schema ({len(samples)} samples); set RAGAS_RUN=1 + LLM key for full Ragas")
        return 0

    # Opt-in path — import only when requested so soft CI never needs ragas installed.
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import faithfulness
    except ImportError as exc:
        print(f"FAIL: install requirements.txt for RAGAS_RUN=1 ({exc})", file=sys.stderr)
        return 1

    ds = Dataset.from_list(
        [
            {
                "question": s["question"],
                "contexts": s["contexts"] or ["(no context)"],
                "answer": s["answer"],
            }
            for s in samples
        ]
    )
    result = evaluate(ds, metrics=[faithfulness])
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
