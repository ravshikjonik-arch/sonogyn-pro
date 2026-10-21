#!/usr/bin/env python3
"""Импорт «Опухоли яичника» (Нейштадт, Ожиганова 2017) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/Опухоли яичника (Нейштадт, Ожиганова 2017)")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/neishtadt-ovary"
DATA_OUT = ROOT / "packages/ovarian-tumor-morphology-atlas/data/atlas.ru.json"

MAX_EDGE = 1200
JPEG_QUALITY = 68

SECTION_RU: dict[str, str] = {
    "basics": "Норма и эмбриогенез",
    "epithelial": "Эпителиально-стромальные опухоли",
    "sex-cord": "Опухоли полового тяжа",
    "germ-cell": "Герминогенные опухоли",
    "rare": "Редкие опухоли",
    "metastatic": "Метастазы",
    "non-neoplastic": "Неопухолевые изменения",
    "methods": "Методика и приложения",
}


def section_for(chapter_num: int) -> str:
    if chapter_num == 1:
        return "basics"
    if chapter_num == 2:
        return "epithelial"
    if chapter_num == 3:
        return "sex-cord"
    if chapter_num == 4:
        return "germ-cell"
    if chapter_num == 5:
        return "rare"
    if chapter_num == 6:
        return "metastatic"
    if chapter_num == 7:
        return "non-neoplastic"
    return "methods"


def chapter_slug(num: int) -> str:
    return f"glava-{num:02d}"


def clean_text(text: str) -> str:
    if not text:
        return ""
    out = text.replace("\x00", " ")
    out = re.sub(r"\s+", " ", out).strip()
    return out[:900]


def extract_summary_blocks(book: Path, rel_file: str) -> list[str]:
    md_path = book / "extracted" / rel_file
    if not md_path.is_file():
        return []
    raw = md_path.read_text(encoding="utf-8", errors="replace")
    blocks: list[str] = []
    parts = re.split(r"---\s*PDF\s+страница\s*\d+\s*---", raw, flags=re.I)
    for part in parts:
        for para in re.split(r"\n\s*\n", part):
            p = clean_text(para.replace("\n", " "))
            if len(p) < 50:
                continue
            if p.startswith("#") or p.startswith("Источник:"):
                continue
            if p.startswith("Рис.") or re.search(r"(кarcinoma|карцином|тератом|serous|муцин|гранулез|дисгермин|FIGO|WHO|ИГХ|immun)", p, re.I):
                blocks.append(p)
            elif len(blocks) < 10 and len(p) < 420:
                blocks.append(p)
    seen: set[str] = set()
    unique: list[str] = []
    for b in blocks:
        key = b[:70]
        if key in seen:
            continue
        seen.add(key)
        unique.append(b)
    return unique[:35]


def convert_image(src: Path, dest: Path) -> None:
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


def load_chapter_images(book: Path, chapter_num: int, dest_root: Path, skip_copy: bool) -> list[dict]:
    img_dir = book / "images" / f"{chapter_num:02d}"
    if not img_dir.is_dir():
        return []
    out: list[dict] = []
    for src in sorted(img_dir.glob("*.png")) + sorted(img_dir.glob("*.jpg")):
        m = re.search(r"p(\d+)", src.stem, re.I)
        page = m.group(1) if m else src.stem
        rel_jpg = f"{chapter_num:02d}/{src.stem}.jpg"
        dest = dest_root / rel_jpg
        if not skip_copy and not dest.is_file():
            convert_image(src, dest)
        out.append(
            {
                "file": rel_jpg,
                "href": f"/clinical-atlas/neishtadt-ovary/{rel_jpg}",
                "captionRu": f"Микро-/макропрепарат, стр. {page} (кн.)",
                "modality": "histology",
                "printPage": page,
            }
        )
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", type=Path, default=DEFAULT_BOOK)
    parser.add_argument("--skip-copy-images", action="store_true")
    args = parser.parse_args()
    book: Path = args.book
    index_path = book / "index.json"
    if not index_path.is_file():
        raise SystemExit(f"Нет {index_path}")

    meta = json.loads(index_path.read_text(encoding="utf-8"))
    chapters_meta = meta.get("chapters") or []

    if not args.skip_copy_images:
        if PUBLIC_IMG.exists():
            shutil.rmtree(PUBLIC_IMG)
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)

    section_order: list[str] = []
    chapters: list[dict] = []

    for ch in chapters_meta:
        rel = ch.get("file", "")
        num = int(Path(rel).stem) if rel else len(chapters) + 1
        sid = section_for(num)
        if sid not in section_order:
            section_order.append(sid)
        slug = chapter_slug(num)
        imgs = load_chapter_images(book, num, PUBLIC_IMG, args.skip_copy_images)
        book_pages = ch.get("book_pages") or [0, 0]
        chapters.append(
            {
                "slug": slug,
                "titleRu": ch.get("title", slug),
                "titleEn": slug,
                "section": sid,
                "sectionRu": SECTION_RU.get(sid, sid),
                "printStart": book_pages[0],
                "printEnd": book_pages[1] if len(book_pages) > 1 else book_pages[0],
                "keyFactsRu": extract_summary_blocks(book, rel),
                "differentialRu": [],
                "images": imgs,
            }
        )

    img_count = sum(len(c["images"]) for c in chapters)
    doc = {
        "meta": {
            "bookId": "neishtadt-ovarian-tumors-2017",
            "titleRu": "Опухоли яичника (морфологический атлас, RU)",
            "sourceEn": meta.get("book", "Нейштадт, Ожиганова, 2017"),
            "disclaimerRu": (
                "Учебный OCR-материал SonoGyn Pro по гистопатологии яичника. "
                "Не заменяет заключение патолога и современные WHO/FIGO-критерии; "
                "сверяйте с O-RADS и клиническим контекстом. Не является диагнозом."
            ),
            "imageBase": "/clinical-atlas/neishtadt-ovary",
            "chapterCount": len(chapters),
            "usImageCount": img_count,
        },
        "sections": [{"id": sid, "titleRu": SECTION_RU.get(sid, sid)} for sid in section_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    if not args.skip_copy_images:
        print(f"JPEG: {sum(1 for _ in PUBLIC_IMG.rglob('*.jpg'))}")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав, {img_count} снимков)")


if __name__ == "__main__":
    main()
