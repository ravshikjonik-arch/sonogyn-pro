#!/usr/bin/env python3
"""Импорт морфологического атласа шейки матки (Desktop/sonogyn-cervix) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-cervix")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/cervix-morpho"
DATA_OUT = ROOT / "packages/cervix-morphology-atlas/data/atlas.ru.json"

SECTION_RU = {
    "0-front": "Введение",
    "1-epithelial": "Эпителиальные опухоли",
    "2-nonepithelial": "Неэпителиальные опухоли",
    "3-methods": "ИГХ, генетика и протокол",
}

MAX_EDGE = 1400
JPEG_QUALITY = 82


def clean_text(text: str) -> str:
    if not text:
        return ""
    out = text.replace("\x00", " ")
    out = re.sub(r"\s+", " ", out).strip()
    out = re.sub(r"\s+\d+\s+I\s+.*$", "", out)
    return out[:800]


def extract_summary_blocks(book: Path, ch: dict) -> list[str]:
    rel = ch.get("file", "")
    md_path = book / rel if rel else None
    if not md_path or not md_path.is_file():
        return []
    raw = md_path.read_text(encoding="utf-8", errors="replace")
    blocks: list[str] = []
    if ch.get("scanned_pages"):
        blocks.append(
            f"Часть страниц ({', '.join(map(str, ch['scanned_pages']))}) представлена сканами в галерее — без полного OCR-текста."
        )
    parts = re.split(r"---\s*печатная страница\s*\d+\s*---", raw)
    for part in parts:
        for para in re.split(r"\n\s*\n", part):
            p = clean_text(para.replace("\n", " "))
            if len(p) < 55:
                continue
            if p.startswith("[") or p.startswith("#") or "скан без текстового" in p.lower():
                continue
            if p.startswith("Рис.") or p.startswith("Рис "):
                blocks.append(p)
            elif re.search(r"(CIN|HSIL|LSIL|аденокarcinoma|кarcinoma|ИГХ|HPV|p16)", p, re.I):
                blocks.append(p)
            elif len(blocks) < 8 and len(p) < 400:
                blocks.append(p)
    seen: set[str] = set()
    unique: list[str] = []
    for b in blocks:
        key = b[:80]
        if key in seen:
            continue
        seen.add(key)
        unique.append(b)
    return unique[:40]


def convert_image(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == ".png":
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
    else:
        shutil.copy2(src, dest)


def public_href(rel_file: str) -> tuple[str, str]:
    """Возвращает (href, stored_rel) с .jpg для png."""
    p = Path(rel_file)
    if p.suffix.lower() == ".png":
        rel_jpg = str(p.with_suffix(".jpg"))
        return f"/clinical-atlas/cervix-morpho/{rel_jpg}", rel_jpg
    return f"/clinical-atlas/cervix-morpho/{rel_file}", rel_file


def load_images_csv(book: Path, atlas_src: Path, atlas_dest: Path) -> dict[str, list[dict]]:
    csv_path = book / "cervix-morpho-atlas/index.csv"
    by_slug: dict[str, list[dict]] = {}
    if not csv_path.is_file():
        return by_slug
    with csv_path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get("slug", "")
            rel = row.get("file", "")
            src = atlas_src / rel
            if not src.is_file():
                continue
            href, stored_rel = public_href(rel)
            dest = atlas_dest / stored_rel
            if not dest.is_file():
                convert_image(src, dest)
            cap = clean_text(row.get("captions") or row.get("caption") or "")
            by_slug.setdefault(slug, []).append(
                {
                    "file": stored_rel,
                    "href": href,
                    "captionRu": cap,
                    "modality": row.get("type", "histology"),
                    "printPage": row.get("page"),
                }
            )
    return by_slug


def copy_scanned_pages(book: Path, atlas_src: Path, atlas_dest: Path) -> None:
    scanned = atlas_src / "_scanned_pages"
    if not scanned.is_dir():
        return
    out = atlas_dest / "_scanned_pages"
    out.mkdir(parents=True, exist_ok=True)
    for src in scanned.glob("*.png"):
        dest = out / src.with_suffix(".jpg").name
        if not dest.is_file():
            convert_image(src, dest)


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
    atlas_src = book / "cervix-morpho-atlas"

    if not args.skip_copy_images:
        if PUBLIC_IMG.exists():
            shutil.rmtree(PUBLIC_IMG)
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)
        images_by_slug = load_images_csv(book, atlas_src, PUBLIC_IMG)
        copy_scanned_pages(book, atlas_src, PUBLIC_IMG)
        n_jpg = sum(1 for _ in PUBLIC_IMG.rglob("*.jpg"))
        print(f"Изображений (JPEG): {n_jpg}")
    else:
        images_by_slug = load_images_csv(book, atlas_src, PUBLIC_IMG)

    section_order: list[str] = []
    for ch in chapters_meta:
        if ch["section"] not in section_order:
            section_order.append(ch["section"])

    chapters = []
    for ch in chapters_meta:
        slug = ch["slug"]
        key_facts = extract_summary_blocks(book, ch)
        imgs = images_by_slug.get(slug, [])

        chapters.append(
            {
                "slug": slug,
                "titleRu": ch["title"],
                "titleEn": slug,
                "section": ch["section"],
                "sectionRu": SECTION_RU.get(ch["section"], ch["section"]),
                "printStart": ch["print_start"],
                "printEnd": ch["print_end"],
                "keyFactsRu": key_facts,
                "differentialRu": [],
                "images": imgs,
            }
        )

    doc = {
        "meta": {
            "bookId": "cervix-tumors-morphology-atlas-ru",
            "titleRu": "Опухоли шейки матки: морфологическая диагностика и генетика (атлас)",
            "sourceEn": "Монография-атлас «Опухоли шейки матки. Морфологическая диагностика и генетика» (RU)",
            "disclaimerRu": (
                "Учебный материал SonoGyn Pro по гистологии и патоморфологии шейки матки. "
                "Не заменяет заключение патолога, протокол конизации/трахелэктомии и клинические "
                "рекомендации по скринингу (CIN, AIS, FIGO)."
            ),
            "imageBase": "/clinical-atlas/cervix-morpho",
            "chapterCount": len(chapters),
            "usImageCount": sum(len(c["images"]) for c in chapters),
        },
        "sections": [{"id": sid, "titleRu": SECTION_RU.get(sid, sid)} for sid in section_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав, {doc['meta']['usImageCount']} снимков)")


if __name__ == "__main__":
    main()
