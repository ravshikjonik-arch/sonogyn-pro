#!/usr/bin/env python3
"""Группирует sonogyn-us-atlas/index.csv в нозологические темы (пороки / находки)."""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

DEFAULT_CSV = Path.home() / "Desktop/sonogyn-prenatal/sonogyn-us-atlas/index.csv"
IMAGE_BASE = "/clinical-atlas/prenatal-echo-ru"
MIN_CHAPTER = 7


def slugify(text: str, max_len: int = 48) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^\w\s-]", "", t, flags=re.UNICODE)
    t = re.sub(r"[\s_]+", "-", t)
    return (t[:max_len] or "finding").strip("-")


def extract_topic(caption: str) -> str:
    c = caption.replace("\r", " ").replace("\n", " ").strip()
    m = re.search(r"Рис\.\s*[\d.]+\.\s*(.+)", c, re.I)
    rest = (m.group(1) if m else c).strip()
    m_week = re.search(r"нед\.\s*([А-ЯЁ][^.]{2,80})", rest)
    if m_week:
        topic = m_week.group(1).strip()
        topic = re.split(r"\.\s*[А–БA-B]\s*[–—-]", topic)[0].strip()
        if len(topic) >= 4:
            return topic[:120]
    first = rest.split(".")[0].strip()
    if 8 <= len(first) <= 100:
        return first
    return rest[:100] if rest else "Эхограмма"


def build_findings(csv_path: Path) -> list[dict]:
    if not csv_path.is_file():
        return []

    with csv_path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    groups: dict[tuple[str, str], dict] = {}

    for row in rows:
        ch = str(row.get("chapter", "")).strip()
        if not ch.isdigit() or int(ch) < MIN_CHAPTER:
            continue
        rel = row.get("file", "").strip()
        if not rel:
            continue
        caption = row.get("caption", "") or ""
        topic = extract_topic(caption)
        topic_key = re.sub(r"\s+", " ", topic.lower())[:80]
        key = (ch, topic_key)
        rel_jpg = str(Path(rel).with_suffix(".jpg"))
        href = f"{IMAGE_BASE}/{rel_jpg}"

        if key not in groups:
            parent = f"glava-{int(ch):02d}"
            slug = slugify(topic)
            groups[key] = {
                "id": f"book:prenatal-finding:{parent}:{slug}",
                "bookId": "prenatal-finding",
                "chapterSlug": parent,
                "findingSlug": slug,
                "titleRu": topic,
                "zone": "obstetrics",
                "domainLabel": "Порок / находка · пренатал",
                "modality": "us",
                "kind": "clinical",
                "imageCount": 0,
                "summaryRu": caption.replace("\r", " ")[:280],
                "keyFactsRu": [caption.replace("\r", " ")[:400]] if caption else [],
                "atlasHref": f"/tools/refs/prenatal-echography-atlas?slug={parent}",
                "previewImageHref": href,
                "imageHrefs": [],
                "linkedSeedNosologyIds": [],
                "parentChapterSlug": parent,
            }
        g = groups[key]
        if href not in g["imageHrefs"]:
            g["imageHrefs"].append(href)
        g["imageCount"] = len(g["imageHrefs"])

    return sorted(groups.values(), key=lambda x: (x["parentChapterSlug"], x["titleRu"]))


def main() -> None:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    findings = build_findings(csv_path)
    print(f"{len(findings)} prenatal findings", file=sys.stderr)
    json.dump(findings, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
