#!/usr/bin/env python3
"""Convert Docling POC JSON → vault-shaped chunks (page-aware).

Does not write to the database. Output is consumed by seed_open_guidelines.py.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


def _norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _table_markdown(rows: list[list[str]]) -> str:
    lines = []
    for row in rows:
        cells = [(_norm_ws(c) or "—") for c in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def chunks_from_docling(doc: dict, *, max_chars: int = 1400) -> list[dict]:
    """Build chunks from items + tables; keep page_start/page_end."""
    out: list[dict] = []
    buf: list[str] = []
    section = None
    page_start = None
    page_end = None

    def flush() -> None:
        nonlocal buf, section, page_start, page_end
        text = _norm_ws("\n".join(buf))
        if len(text) < 40:
            buf, section, page_start, page_end = [], section, None, None
            return
        out.append(
            {
                "section_title": section,
                "page_start": page_start,
                "page_end": page_end,
                "content": text,
                "content_hash": _hash(text),
                "token_count": max(1, len(text) // 4),
                "review_status": "review_required",
            }
        )
        buf = []
        page_start = None
        page_end = None

    for it in doc.get("items") or []:
        text = _norm_ws(it.get("text") or "")
        if not text:
            continue
        label = (it.get("label") or "").lower()
        page = it.get("page")
        if "header" in label or label in {"section_header", "title"}:
            flush()
            section = text[:200]
            continue
        if page is not None:
            page_start = page if page_start is None else page_start
            page_end = page
        if buf and sum(len(x) for x in buf) + len(text) > max_chars:
            flush()
            page_start = page
            page_end = page
        buf.append(text)

    flush()

    for t in doc.get("tables") or []:
        rows = t.get("rows") or []
        if not rows:
            continue
        md = _table_markdown(rows)
        if len(md) < 20:
            continue
        page = t.get("page")
        # Split very wide tables by character budget
        if len(md) <= max_chars:
            pieces = [md]
        else:
            pieces = []
            cur: list[str] = []
            for line in md.splitlines():
                if cur and sum(len(x) for x in cur) + len(line) > max_chars:
                    pieces.append("\n".join(cur))
                    cur = []
                cur.append(line)
            if cur:
                pieces.append("\n".join(cur))
        for piece in pieces:
            out.append(
                {
                    "section_title": f"Таблица (стр. {page})" if page else "Таблица",
                    "page_start": page,
                    "page_end": page,
                    "content": piece,
                    "content_hash": _hash(piece),
                    "token_count": max(1, len(piece) // 4),
                    "review_status": "review_required",
                }
            )

    for i, c in enumerate(out):
        c["chunk_index"] = i
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Docling JSON path")
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", required=True)
    args = ap.parse_args()
    doc = json.loads(Path(args.input).read_text(encoding="utf-8"))
    chunks = chunks_from_docling(doc)
    payload = {
        "source": {"title": args.title, "pages": doc.get("pages"), "parser": doc.get("parser")},
        "chunks": chunks,
    }
    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok {len(chunks)} chunks → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
