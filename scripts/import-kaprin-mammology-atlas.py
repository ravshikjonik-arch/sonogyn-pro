#!/usr/bin/env python3
"""Импорт «Маммология: национальное руководство» (Desktop/sonogyn-mammology) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-mammology")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/kaprin-mammology"
DATA_OUT = ROOT / "packages/mammology-national-atlas/data/atlas.ru.json"

SECTION_RU = {
    "0-front": "Введение и методология",
    "1-obshchie": "Раздел I. Общие сведения",
    "2-diagnostika": "Раздел II. Диагностика",
    "3-lechenie": "Раздел III. Лечение и реабилитация",
    "4-appendix": "Приложения",
}

MAX_EDGE = 1400
JPEG_QUALITY = 80


def clean_text(text: str) -> str:
    if not text:
        return ""
    out = text.replace("\x00", " ")
    out = re.sub(r"\s+", " ", out).strip()
    return out[:900]


def extract_summary_blocks(book: Path, ch: dict) -> list[str]:
    rel = ch.get("file", "")
    md_path = book / rel if rel else None
    if not md_path or not md_path.is_file():
        return []
    raw = md_path.read_text(encoding="utf-8", errors="replace")
    blocks: list[str] = []
    parts = re.split(r"---\s*печатные страницы[^\n]*---", raw)
    for part in parts:
        for para in re.split(r"\n\s*\n", part):
            p = clean_text(para.replace("\n", " "))
            if len(p) < 60:
                continue
            if p.startswith("#") or p.startswith("- Раздел:") or p.startswith("- Печатные"):
                continue
            if p.startswith("• ") or p.startswith("- "):
                blocks.append(p.lstrip("•- ").strip())
            elif re.search(r"(BI-RADS|УЗИ|маммограф|эластограф|МЖ|рак молочной)", p, re.I):
                blocks.append(p)
            elif len(blocks) < 12 and len(p) < 500:
                blocks.append(p)
    seen: set[str] = set()
    unique: list[str] = []
    for b in blocks:
        key = b[:70]
        if key in seen:
            continue
        seen.add(key)
        unique.append(b)
    return unique[:45]


def chapter_scan_dir(book: Path, ch: dict) -> Path | None:
    base = book / "page_scans_by_chapter" / ch["section"]
    preferred = base / f"{ch['print_start']:03d}-{ch['slug']}"
    if preferred.is_dir():
        return preferred
    for d in base.iterdir() if base.is_dir() else []:
        if d.is_dir() and ch["slug"] in d.name:
            return d
    return None


def optimize_jpeg(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "sips",
            "-Z",
            str(MAX_EDGE),
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            str(JPEG_QUALITY),
            str(src),
            "--out",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )


def load_figure_captions(book: Path) -> dict[str, list[str]]:
    csv_path = book / "figures_index.csv"
    by_slug: dict[str, list[str]] = {}
    if not csv_path.is_file():
        return by_slug
    with csv_path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            slug = row.get("slug", "")
            cap = clean_text(row.get("caption", "") or "")
            if len(cap) < 8:
                continue
            cap = re.sub(r"^[\),.\s]+", "", cap)
            if len(cap) < 8:
                continue
            typ = row.get("type", "other")
            page = row.get("print_start", "")
            label = f"[стр. {page}, {typ}] {cap}" if page else cap
            by_slug.setdefault(slug, []).append(label)
    return by_slug


def copy_chapter_scans(book: Path, ch: dict, dest_root: Path) -> list[dict]:
    scan_dir = chapter_scan_dir(book, ch)
    if not scan_dir:
        return []
    rel_base = f"{ch['section']}/{ch['print_start']:03d}-{ch['slug']}"
    images: list[dict] = []
    for src in sorted(scan_dir.glob("*.jpg")):
        rel = f"{rel_base}/{src.name}"
        dest = dest_root / rel
        if not dest.is_file():
            optimize_jpeg(src, dest)
        images.append(
            {
                "file": rel,
                "href": f"/clinical-atlas/kaprin-mammology/{rel}",
                "captionRu": f"Разворот учебника ({src.stem})",
                "modality": "scan",
                "printPage": src.stem.lstrip("p"),
            }
        )
    return images


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", type=Path, default=DEFAULT_BOOK)
    parser.add_argument("--skip-copy-images", action="store_true")
    args = parser.parse_args()
    book: Path = args.book
    index_path = book / "extracted/index.json"
    if not index_path.is_file():
        raise SystemExit(f"Нет {index_path}")

    chapters_meta = json.loads(index_path.read_text(encoding="utf-8"))
    figure_caps = load_figure_captions(book)

    if not args.skip_copy_images:
        if PUBLIC_IMG.exists():
            shutil.rmtree(PUBLIC_IMG)
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)

    section_order: list[str] = []
    for ch in chapters_meta:
        if ch["section"] not in section_order:
            section_order.append(ch["section"])

    chapters = []
    for ch in chapters_meta:
        slug = ch["slug"]
        if args.skip_copy_images:
            scan_dir = chapter_scan_dir(book, ch)
            imgs = []
            if scan_dir:
                rel_base = f"{ch['section']}/{ch['print_start']:03d}-{ch['slug']}"
                for src in sorted(scan_dir.glob("*.jpg")):
                    rel = f"{rel_base}/{src.name}"
                    imgs.append(
                        {
                            "file": rel,
                            "href": f"/clinical-atlas/kaprin-mammology/{rel}",
                            "captionRu": f"Разворот учебника ({src.stem})",
                            "modality": "scan",
                            "printPage": src.stem.lstrip("p"),
                        }
                    )
        else:
            imgs = copy_chapter_scans(book, ch, PUBLIC_IMG)

        chapters.append(
            {
                "slug": slug,
                "titleRu": ch["title"],
                "titleEn": slug,
                "section": ch["section"],
                "sectionRu": SECTION_RU.get(ch["section"], ch["section"]),
                "printStart": ch["print_start"],
                "printEnd": ch["print_end"],
                "keyFactsRu": extract_summary_blocks(book, ch),
                "figureCaptionsRu": figure_caps.get(slug, [])[:80],
                "differentialRu": [],
                "images": imgs,
            }
        )

    spread_count = sum(len(c["images"]) for c in chapters)
    doc = {
        "meta": {
            "bookId": "kaprin-mammology-national-guide-2ed-2019",
            "titleRu": "Маммология: национальное руководство (учебный атлас OCR)",
            "sourceEn": "Каприн И.С., Рожкова Н.И. Маммология: национальное руководство, 2-е изд. (2019)",
            "disclaimerRu": (
                "Учебный материал SonoGyn Pro на основе OCR (Apple Vision). Числа и термины сверяйте "
                "с разворотами скана; не заменяет BI-RADS ACR, клиническое заключение и КР МЗ РФ."
            ),
            "imageBase": "/clinical-atlas/kaprin-mammology",
            "chapterCount": len(chapters),
            "usImageCount": spread_count,
        },
        "sections": [{"id": sid, "titleRu": SECTION_RU.get(sid, sid)} for sid in section_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    if not args.skip_copy_images:
        n = sum(1 for _ in PUBLIC_IMG.rglob("*.jpg"))
        print(f"Разворотов (JPEG): {n}")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав, {spread_count} разворотов, {sum(len(c['figureCaptionsRu']) for c in chapters)} подписей)")


if __name__ == "__main__":
    main()
