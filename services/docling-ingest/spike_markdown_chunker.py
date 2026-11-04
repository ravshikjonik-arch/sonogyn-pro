#!/usr/bin/env python3
"""Soft Docling-contract spike: markdown → vault-shaped chunks (no Docling install)."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


def chunk_markdown(text: str, source_title: str) -> list[dict]:
    parts = re.split(r"\n(?=## )", text.strip())
    chunks: list[dict] = []
    for i, part in enumerate(parts):
        body = part.strip()
        if not body:
            continue
        lines = body.splitlines()
        section = lines[0].lstrip("# ").strip() if lines else f"section-{i}"
        content = "\n".join(lines[1:]).strip() if len(lines) > 1 else body
        if not content:
            content = body
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        chunks.append(
            {
                "chunk_index": i,
                "section_title": section,
                "chapter": source_title,
                "page_start": None,
                "page_end": None,
                "content": content,
                "content_hash": digest,
                "review_status": "raw",
                "token_count": max(1, len(content.split())),
            }
        )
    return chunks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    path = Path(args.input)
    if not path.is_file():
        print(f"FAIL missing input {path}", file=sys.stderr)
        return 1
    text = path.read_text(encoding="utf-8")
    title = path.stem
    chunks = chunk_markdown(text, title)
    if len(chunks) < 1:
        print("FAIL no chunks", file=sys.stderr)
        return 1
    payload = {
        "source": {"title": title, "path": str(path), "ingest": "markdown-spike"},
        "chunks": chunks,
        "note": "Compatible shape for source_chunks; Docling run_docling_spike.py emits the same keys.",
    }
    out = Path(args.out)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok {len(chunks)} chunks → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
