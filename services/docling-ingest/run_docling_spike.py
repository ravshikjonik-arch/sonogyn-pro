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
    parser.add_argument(
        "--ocr",
        action="store_true",
        help="Force OCR pipeline (scanned PDFs). Always keep review_required; run ocr_quality_gate.py before publish.",
    )
    args = parser.parse_args()
    src = Path(args.input)
    if not src.is_file():
        print(f"FAIL missing {src}", file=sys.stderr)
        return 1

    try:
        from docling.document_converter import DocumentConverter
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.document_converter import PdfFormatOption
    except ImportError:
        print(
            "FAIL: docling not installed. Use spike_markdown_chunker.py for soft CI, "
            "or: pip install -r requirements-docling.txt",
            file=sys.stderr,
        )
        return 1

    if args.ocr:
        pipeline = PdfPipelineOptions()
        pipeline.do_ocr = True
        pipeline.do_table_structure = True
        converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline)}
        )
        ingest = "docling_ocr"
    else:
        converter = DocumentConverter()
        ingest = "docling"

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
                # OCR never auto-publishes — Source Studio / seed must keep review_required
                "review_status": "review_required" if args.ocr else "raw",
                "token_count": max(1, len(content.split())),
            }
        )

    payload = {
        "source": {
            "title": src.stem,
            "path": str(src),
            "ingest": ingest,
            "ocr": bool(args.ocr),
            "note": "Run ocr_quality_gate.py --json OUT before vault publish when ocr=true",
        },
        "chunks": chunks,
    }
    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok {ingest} {len(chunks)} chunks → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
