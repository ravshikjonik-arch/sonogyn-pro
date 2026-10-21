#!/usr/bin/env python3
"""Импорт «Пренатальная эхография» (Desktop/sonogyn-prenatal) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-prenatal")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/prenatal-echo-ru"
DATA_OUT = ROOT / "packages/prenatal-echography-atlas/data/atlas.ru.json"

PART_RU = {
    "1-osnovy": "Часть I. Основы пренатальной эхографии",
    "2-pervaya-polovina": "Часть II. Первая половина беременности",
    "3-vtoraya-polovina": "Часть III. Вторая половина — пороки по системам",
}

MAX_EDGE = 1400
JPEG_QUALITY = 82


def chapter_slug(ch: dict) -> str:
    return f"glava-{int(ch['n']):02d}"


def clean_text(text: str) -> str:
    if not text:
        return ""
    out = text.replace("\x00", " ")
    out = re.sub(r",\s*\n", "", out)
    out = re.sub(r"\s+", " ", out).strip()
    return out[:900]


def extract_summary_blocks(book: Path, ch: dict) -> list[str]:
    rel = ch.get("file", "")
    md_path = book / rel if rel else None
    if not md_path or not md_path.is_file():
        return []
    raw = md_path.read_text(encoding="utf-8", errors="replace")
    blocks: list[str] = []
    parts = re.split(r"---\s*PDF страница\s*\d+\s*---", raw)
    for part in parts:
        for para in re.split(r"\n\s*\n", part):
            p = clean_text(para.replace("\n", " "))
            if len(p) < 55:
                continue
            if p.startswith("#") or p.startswith("- Часть:") or p.startswith("- PDF"):
                continue
            if p.startswith("• ") or p.startswith("- "):
                blocks.append(p.lstrip("•- ").strip())
            elif re.search(r"(УЗИ|допpler|фетометр|плацента|ТВП|КТР|порок|BI-RADS|ЦДК|ПИ\b|ИР\b)", p, re.I):
                blocks.append(p)
            elif len(blocks) < 15 and len(p) < 450:
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


def jpx_to_jpeg(src: Path, dest: Path) -> None:
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


def load_images_csv(book: Path, atlas_src: Path, atlas_dest: Path, skip_copy: bool) -> dict[str, list[dict]]:
    csv_path = atlas_src / "index.csv"
    by_ch: dict[str, list[dict]] = {}
    if not csv_path.is_file():
        return by_ch
    with csv_path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            ch_num = str(row.get("chapter", "")).strip()
            if not ch_num:
                continue
            slug = f"glava-{int(ch_num):02d}"
            rel_jpx = row.get("file", "")
            src = atlas_src / rel_jpx
            if not src.is_file():
                continue
            rel_jpg = Path(rel_jpx).with_suffix(".jpg").as_posix()
            dest = atlas_dest / rel_jpg
            if not skip_copy and not dest.is_file():
                jpx_to_jpeg(src, dest)
            cap = clean_text(row.get("caption", "") or "")
            typ = row.get("type", "us")
            by_ch.setdefault(slug, []).append(
                {
                    "file": rel_jpg,
                    "href": f"/clinical-atlas/prenatal-echo-ru/{rel_jpg}",
                    "captionRu": cap or f"Эхограмма (гл. {ch_num})",
                    "modality": typ.split("+")[0] if typ else "us",
                    "printPage": row.get("pdf_page"),
                }
            )
    return by_ch


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
    atlas_src = book / "sonogyn-us-atlas"

    if not args.skip_copy_images:
        if PUBLIC_IMG.exists():
            shutil.rmtree(PUBLIC_IMG)
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)

    images_by_slug = load_images_csv(book, atlas_src, PUBLIC_IMG, args.skip_copy_images)

    part_order: list[str] = []
    for ch in chapters_meta:
        if ch["part"] not in part_order:
            part_order.append(ch["part"])

    chapters = []
    for ch in chapters_meta:
        slug = chapter_slug(ch)
        chapters.append(
            {
                "slug": slug,
                "titleRu": ch["title"],
                "titleEn": slug,
                "section": ch["part"],
                "sectionRu": PART_RU.get(ch["part"], ch["part"]),
                "printStart": ch["pdf_start"],
                "printEnd": ch["pdf_end"],
                "keyFactsRu": extract_summary_blocks(book, ch),
                "differentialRu": [],
                "images": images_by_slug.get(slug, []),
            }
        )

    img_count = sum(len(c["images"]) for c in chapters)
    doc = {
        "meta": {
            "bookId": "prenatal-echography-ru-guide",
            "titleRu": "Пренатальная эхография (учебный атлас УЗИ, RU)",
            "sourceEn": "Руководство по пренатальной эхографии (RU), ~552 стр., 20 глав",
            "disclaimerRu": (
                "Учебный материал SonoGyn Pro. Текст из OCR и подписи к снимкам; часть нормативов "
                "может отличаться от актуальных ISUOG/FMF — сверяйте с современными протоколами "
                "скрининга и фетометрии. Не заменяет клиническое заключение."
            ),
            "imageBase": "/clinical-atlas/prenatal-echo-ru",
            "chapterCount": len(chapters),
            "usImageCount": img_count,
        },
        "sections": [{"id": pid, "titleRu": PART_RU.get(pid, pid)} for pid in part_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    if not args.skip_copy_images:
        print(f"JPEG: {sum(1 for _ in PUBLIC_IMG.rglob('*.jpg'))}")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав, {img_count} УЗИ)")


if __name__ == "__main__":
    main()
