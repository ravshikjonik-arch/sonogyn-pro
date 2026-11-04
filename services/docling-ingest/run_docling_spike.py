#!/usr/bin/env python3
"""Opt-in Docling PDF → vault-shaped JSON. Requires: pip install -r requirements-docling.txt"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to PDF/DOCX")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    src = Path(args.input)
    if not src.is_file():
        print(f"FAIL missing {src}", file=sys.stderr)
        return 1

    try:
        from docling.document_converter import DocumentConverter
    except ImportError:
        print(
            "FAIL: docling not installed. Use spike_markdown_chunker.py for soft CI, "
            "or: pip install -r requirements-docling.txt",
            file=sys.stderr,
        )
        return 1

    converter = DocumentConverter()
    result = converter.convert(str(src))
    # Export markdown-ish text; split by headings as a first spike (not production-grade).
    md = result.document.export_to_markdown()
    parts = [p.strip() for p in md.split("\n## ") if p.strip()]
    chunks = []
    for i, part in enumerate(parts):
        if i == 0 and not part.startswith("#"):
            section = "intro"
            content = part
        else:
            lines = part.splitlines()
            section = lines[0].lstrip("# ").strip() if lines else f"section-{i}"
            content = "\n".join(lines[1:]).strip() if len(lines) > 1 else part
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        chunks.append(
            {
                "chunk_index": i,
                "section_title": section,
                "chapter": src.stem,
                "page_start": None,
                "page_end": None,
                "content": content,
                "content_hash": digest,
                "review_status": "raw",
                "token_count": max(1, len(content.split())),
            }
        )

    payload = {
        "source": {"title": src.stem, "path": str(src), "ingest": "docling"},
        "chunks": chunks,
    }
    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok docling {len(chunks)} chunks → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
