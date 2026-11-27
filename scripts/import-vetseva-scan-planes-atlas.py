#!/usr/bin/env python3
"""Импорт «Атлас УЗ-плоскостей и позиционирования датчика» (Ветшева) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(
    "/Users/yakrav7700/Desktop/Atlas_ultrazvukovykh_ploskostey_skanirovaniya_i_pozitsionirovaniya.pdf"
)
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/vetseva-scan-planes"
DATA_OUT = ROOT / "packages/us-scan-planes-atlas/data/atlas.ru.json"

SECTIONS: list[tuple[str, str, tuple[str, ...]]] = [
    ("infant-head", "Голова младенца", ("Голова младенца",)),
    ("head", "Голова", ("Голова.", "Голова ")),
    ("neck", "Шея", ("Шея.", "Шея ")),
    ("heart", "Сердце", ("Сердце.", "Сердце ")),
    ("chest", "Грудь", ("Грудь.", "Грудь ")),
    ("abdomen", "Живот", ("Живот.", "Живот ")),
    ("pelvis", "Таз", ("Таз.", "Таз ", "Наружные половые органы")),
    ("upper-limb", "Верхние конечности", ("Верхняя конечность", "Верхние конечности")),
    ("lower-limb", "Нижние конечности", ("Нижняя конечность", "Нижние конечности")),
]

MAX_EDGE = 1600
JPEG_QUALITY = 85
SKIP_PAGES = {0, 1, 157}  # титул, оглавление, контакты (0-based)


def clean_text(text: str) -> str:
    if not text:
        return ""
    out = text.replace("\x00", " ")
    out = re.sub(r"\s+", " ", out).strip()
    return out


def detect_section(text: str) -> tuple[str, str]:
    for sid, title_ru, needles in SECTIONS:
        for n in needles:
            if n in text:
                return sid, title_ru
    return "abdomen", "Живот"


def parse_page(text: str, page_num: int) -> dict:
    flat = clean_text(text)
    plane_m = re.search(
        r"([А-Яа-яёA-Za-z\-]+(?:\s+[А-Яа-яё\-]+){0,5})\s+плоскость\s+сканирования\.?",
        flat,
        re.I,
    )
    plane = plane_m.group(0).rstrip(".") if plane_m else ""

    region = ""
    for pattern in (
        r"(Голова младенца\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Голова\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Шея\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Сердце\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Грудь\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Живот\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Таз\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Наружные половые органы\.[^\.]+\.)",
        r"(Верхняя конечность\.[^\.]+(?:\.[^\.]+){0,2}\.)",
        r"(Нижняя конечность\.[^\.]+(?:\.[^\.]+){0,2}\.)",
    ):
        m = re.search(pattern, flat)
        if m:
            region = m.group(1).strip()
            break

    title_parts = [p for p in (region, plane) if p]
    title_ru = " ".join(title_parts) if title_parts else f"Страница {page_num}"

    sid, section_ru = detect_section(flat)

    anatomy = ""
    tail = flat.split("Схема постановки датчика")[-1].strip() if "Схема" in flat else flat
    tail = re.sub(r"Изображение на экране прибора\s*", "", tail)
    tail = re.sub(
        r"(Верхняя поверхность|Нижняя поверхность|Лево|Право|Задняя|Передняя|Боковая)[^\.]*\.?",
        "",
        tail,
    )
    tail = clean_text(tail)
    if len(tail) > 25 and len(tail) < 220 and "плоскость" not in tail.lower():
        anatomy = tail

    key_facts: list[str] = []
    if anatomy:
        key_facts.append(f"На снимке/схеме: {anatomy}")
    if plane:
        key_facts.append(plane + ".")

    return {
        "section": sid,
        "sectionRu": section_ru,
        "titleRu": title_ru[:240],
        "keyFactsRu": key_facts[:8],
        "printStart": page_num,
        "printEnd": page_num,
    }


def render_page(pdf_path: Path, page_index: int, dest: Path) -> None:
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise SystemExit("Установите PyMuPDF: pip install pymupdf") from e

    dest.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    page = doc[page_index]
    rect = page.rect
    scale = min(MAX_EDGE / rect.width, MAX_EDGE / rect.height, 2.0)
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    tmp = dest.with_suffix(".png")
    pix.save(tmp)
    subprocess.run(
        [
            "sips",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            str(JPEG_QUALITY),
            str(tmp),
            "--out",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )
    tmp.unlink(missing_ok=True)
    doc.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args()

    if not args.pdf.is_file():
        raise SystemExit(f"PDF не найден: {args.pdf}")

    try:
        import pypdf
    except ImportError as e:
        raise SystemExit("pip install pypdf") from e

    reader = pypdf.PdfReader(str(args.pdf))
    chapters: list[dict] = []
    us_count = 0

    for i in range(len(reader.pages)):
        if i in SKIP_PAGES:
            continue
        page_num = i + 1
        text = reader.pages[i].extract_text() or ""
        meta = parse_page(text, page_num)
        rel = f"p{page_num:03d}.jpg"
        href = f"/clinical-atlas/vetseva-scan-planes/{rel}"
        dest = PUBLIC_IMG / rel

        if not args.skip_render and (not dest.is_file() or dest.stat().st_size < 500):
            render_page(args.pdf, i, dest)

        if dest.is_file():
            us_count += 1

        chapters.append(
            {
                "slug": f"p{page_num:03d}",
                "titleRu": meta["titleRu"],
                "titleEn": "",
                "section": meta["section"],
                "sectionRu": meta["sectionRu"],
                "printStart": meta["printStart"],
                "printEnd": meta["printEnd"],
                "keyFactsRu": meta["keyFactsRu"],
                "differentialRu": [],
                "images": [
                    {
                        "file": rel,
                        "href": href,
                        "captionRu": meta["titleRu"],
                        "modality": "us+scheme",
                        "printPage": str(page_num),
                    }
                ],
            }
        )

    doc = {
        "meta": {
            "bookId": "vetseva-us-scan-planes-v1.2",
            "titleRu": "Атлас ультразвуковых плоскостей сканирования и позиционирования датчика",
            "sourceEn": "Vetseva N. Atlas of ultrasound scanning planes and probe positioning, v1.2 (2024)",
            "disclaimerRu": (
                "Учебный материал для отработки плоскостей сканирования и постановки датчика. "
                "Не заменяет клиническое заключение. Использование снимков — по согласованию с правообладателем."
            ),
            "imageBase": "/clinical-atlas/vetseva-scan-planes",
            "chapterCount": len(chapters),
            "usImageCount": us_count,
        },
        "sections": [{"id": sid, "titleRu": title} for sid, title, _ in SECTIONS],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK chapters={len(chapters)} images={us_count} → {DATA_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()