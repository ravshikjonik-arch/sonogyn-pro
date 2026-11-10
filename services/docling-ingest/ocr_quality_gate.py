#!/usr/bin/env python3
"""OCR / extract quality gate before vault publish.

Rejects obvious Cyrillic corruption (latin lookalikes, too few Cyrillic letters).
Exit 0 = pass (or warn-only); exit 2 = hard fail.

Usage:
  python3 ocr_quality_gate.py --text-file path.txt
  python3 ocr_quality_gate.py --json /tmp/docling.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

CYR = re.compile(r"[А-Яа-яЁё]")
LATIN_LOOKALIKE = re.compile(
    r"\b(diagnostika|rekomendacii|ultrazvuk|щитовидн[ао]й\s+gland|bolезн)\b",
    re.I,
)


def score_text(text: str) -> dict:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return {"ok": False, "reason": "empty_text", "cyr_ratio": 0.0, "chars": 0}
    cyr = sum(1 for c in letters if CYR.match(c))
    ratio = cyr / len(letters)
    lookalike = bool(LATIN_LOOKALIKE.search(text))
    ok = ratio >= 0.55 and not lookalike and len(text) >= 80
    reason = "ok"
    if ratio < 0.55:
        reason = f"low_cyrillic_ratio:{ratio:.2f}"
    elif lookalike:
        reason = "latin_lookalike_tokens"
    elif len(text) < 80:
        reason = "too_short"
    return {
        "ok": ok,
        "reason": reason,
        "cyr_ratio": round(ratio, 3),
        "chars": len(text),
        "warn": lookalike or ratio < 0.7,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--text-file")
    p.add_argument("--json", help="Docling/vault JSON with chunks[].content")
    p.add_argument("--strict", action="store_true", help="exit 2 on fail")
    args = p.parse_args()

    texts: list[str] = []
    if args.text_file:
        texts.append(Path(args.text_file).read_text(encoding="utf-8", errors="replace"))
    if args.json:
        doc = json.loads(Path(args.json).read_text(encoding="utf-8"))
        chunks = doc.get("chunks") or []
        texts.append("\n".join(str(c.get("content") or "") for c in chunks))
    if not texts:
        print("need --text-file or --json", file=sys.stderr)
        return 1

    joined = "\n\n".join(texts)
    result = score_text(joined)
    print(json.dumps(result, ensure_ascii=False))
    if not result["ok"] and args.strict:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
