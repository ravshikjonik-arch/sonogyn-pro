#!/usr/bin/env python3
"""Импорт атласа Блинов/Емельяненко (скан PDF) → webp + OCR + JSON для SonoGyn Pro."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(
    "/Users/yakrav7700/Desktop/Атлас_по_ультразвуковой_диагностике_в_акушерстве_эхограммы_с_комментариями.pdf"
)
OCR_SWIFT = ROOT / "scripts" / "mac-vision-ocr.swift"
PUBLIC_PAGES = ROOT / "apps/web/public/clinical-atlas/blinov/pages"
DATA_OUT = ROOT / "packages/obstetric-atlas/data"
PACKAGE_ASSETS = ROOT / "packages/obstetric-atlas/assets/pages"

SOURCE_META = {
    "book_id": "blinov-emelyanenko-2024",
    "title": "Атлас по ультразвуковой диагностике в акушерстве (эхограммы с комментариями)",
    "authors": ["Блинов А.Ю.", "Емельяненко Е.С."],
    "publisher": "МЕДпресс-информ",
    "year": 2024,
    "isbn": "978-5-907632-55-4",
    "copyright": "© Блинов А.Ю., Емельяненко Е.С., 2024; © МЕДпресс-информ, 2024",
    "usage_note": "Учебный слой SonoGyn Pro. Для публичного распространения изображений — лицензия издателя.",
}

PART_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("intro", re.compile(r"\bВВЕДЕНИЕ\b", re.I)),
    ("early", re.compile(r"ранн(ие|яя)\s+срок|до\s*11\s*нед", re.I)),
    ("anatomy_11_14", re.compile(r"11\s*[–—-]\s*14\s*нед|топографическ", re.I)),
    ("appendix", re.compile(r"приложени", re.I)),
    ("conclusion", re.compile(r"\bзаключени", re.I)),
]

TOPIC_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("gestational_sac", re.compile(r"плодн(ое|ого)\s+яйц|хориальн", re.I)),
    ("yolk_sac", re.compile(r"желточн", re.I)),
    ("embryo", re.compile(r"эмбрион", re.I)),
    ("heart_activity", re.compile(r"сердечн|чсс|сердц", re.I)),
    ("unfavorable", re.compile(r"неблагоприятн", re.I)),
    ("sagittal_plane", re.compile(r"сагиттал", re.I)),
    ("axial_plane", re.compile(r"аксиальн|ретроназальн", re.I)),
    ("doppler", re.compile(r"цдк|допплер|венозн|пуповин", re.I)),
    ("nasal_bone", re.compile(r"носов(ые|ая)\s+кост", re.I)),
    ("chromosomal_markers", re.compile(r"хромосом|маркер", re.I)),
]

MM_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*мм", re.I)
WEEK_RANGE_RE = re.compile(r"(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*нед", re.I)
WEEK_SINGLE_RE = re.compile(r"(\d{1,2})\s*нед", re.I)
PAGE_NUM_RE = re.compile(r"^\s*(\d{1,3})\s*$")


@dataclass
class AtlasPage:
    id: str
    page_number: int
    book_page_label: int | None
    image_href: str
    part: str
    topics: list[str]
    ga_weeks_min: int | None
    ga_weeks_max: int | None
    measurements_mm: list[float]
    title: str | None
    section: str | None
    ocr_text: str
    rules: list[dict] = field(default_factory=list)
    teaching_hint: str | None = None
    quality: str = "draft"


def run_ocr(image_path: Path) -> str:
    if not OCR_SWIFT.exists():
        return ""
    try:
        proc = subprocess.run(
            ["swift", str(OCR_SWIFT), str(image_path)],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            return ""
        return proc.stdout.strip()
    except (subprocess.TimeoutExpired, OSError):
        return ""


def classify_part(text: str, page_index: int) -> str:
    if page_index >= 101:
        return "appendix"
    for name, pattern in PART_PATTERNS:
        if pattern.search(text):
            return name
    if page_index < 6:
        return "intro"
    if page_index < 55:
        return "early"
    return "anatomy_11_14"


def classify_topics(text: str) -> list[str]:
    topics = [name for name, pattern in TOPIC_PATTERNS if pattern.search(text)]
    return topics or ["general"]


def extract_ga_range(text: str) -> tuple[int | None, int | None]:
    m = WEEK_RANGE_RE.search(text)
    if m:
        return int(m.group(1)), int(m.group(2))
    singles = [int(x) for x in WEEK_SINGLE_RE.findall(text) if 4 <= int(x) <= 42]
    if singles:
        return min(singles), max(singles)
    return None, None


def extract_title_section(text: str) -> tuple[str | None, str | None]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    title = None
    section = None
    for ln in lines[:8]:
        if re.search(r"ультразвуковое\s+исследование", ln, re.I):
            title = ln
        if re.search(r"нормальная\s+ультразвуковая\s+топограф", ln, re.I):
            title = ln
        if re.search(r"исследование\s+на\s+сроках|срез\s+через|визуализация", ln, re.I):
            section = ln
    return title, section


def infer_rules(text: str, topics: list[str]) -> list[dict]:
    rules: list[dict] = []
    lower = text.lower()
    if "yolk_sac" in topics or "желточн" in lower:
        if re.search(r"3\s*[–—-]\s*6\s*мм", text):
            rules.append(
                {
                    "id": "yolk_sac_diameter_mm",
                    "field": "yolk_sac_diameter_mm",
                    "op": "between",
                    "min": 3,
                    "max": 6,
                    "label": "Диаметр желточного мешка",
                    "fail_message": "Вне нормы 3–6 мм — неблагоприятный прогноз (атлас, с. 19).",
                }
            )
    if "gestational_sac" in topics and re.search(r"не\s+менее\s+2\s*мм|≥\s*2\s*мм|2\s*мм", text):
        rules.append(
            {
                "id": "gest_sac_ring_mm",
                "field": "gest_sac_ring_mm",
                "op": "gte",
                "min": 2,
                "label": "Толщина гиперэхогенного кольца плодного яйца",
                "fail_message": "Кольцо плодного яйца <2 мм — вне нормы (атлас, ранние сроки).",
            }
        )
    if "неблагоприятн" in lower:
        rules.append(
            {
                "id": "prognosis_gate",
                "field": "early_pregnancy_criteria_met",
                "op": "eq",
                "value": True,
                "fail_message": "Признаки вне нормы — прогноз неблагоприятный (атлас).",
            }
        )
    return rules


def teaching_hint_from_page(part: str, topics: list[str], text: str) -> str | None:
    if "sagittal_plane" in topics:
        return "Проверьте строго сагиттальную плоскость на всём протяжении плода — иначе КТР/ТВП недействительны."
    if "axial_plane" in topics and "nasal_bone" in topics:
        return "Ретроназальный треугольник: 2 эхогенных точки НК, симметричные скулы, гладкое твёрдое нёбо."
    if "doppler" in topics:
        return "ЦДК: визуализируйте вену пуповины, венозный проток и сердце в одной сагиттальной плоскости."
    if part == "conclusion" or "11" in text and "13" in text:
        return "Оптимальное окно расширенного УЗИ: 11–13+6 нед — последовательный осмотр по алгоритму."
    return None


def guess_book_page_label(text: str, pdf_page_index: int) -> int | None:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for ln in reversed(lines[-6:]):
        m = PAGE_NUM_RE.match(ln)
        if m:
            val = int(m.group(1))
            if 1 <= val <= 112:
                return val
    return pdf_page_index  # fallback: 1-based PDF page ≈ book page


def export_page_image(doc: fitz.Document, page_index: int, out_path: Path, dpi: int) -> None:
    page = doc.load_page(page_index)
    pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(out_path), output="jpeg", jpg_quality=82)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Blinov obstetric atlas PDF")
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--limit", type=int, default=0, help="Process only first N pages (0 = all)")
    parser.add_argument("--skip-ocr", action="store_true")
    parser.add_argument("--dpi", type=int, default=120)
    args = parser.parse_args()

    if not args.pdf.exists():
        sys.exit(f"PDF не найден: {args.pdf}")

    PUBLIC_PAGES.mkdir(parents=True, exist_ok=True)
    PACKAGE_ASSETS.mkdir(parents=True, exist_ok=True)
    DATA_OUT.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(args.pdf))
    total = doc.page_count if args.limit <= 0 else min(args.limit, doc.page_count)

    pages: list[AtlasPage] = []
    all_rules: dict[str, dict] = {}

    for i in range(total):
        page_no = i + 1
        filename = f"page-{page_no:03d}.jpg"
        public_path = PUBLIC_PAGES / filename
        package_path = PACKAGE_ASSETS / filename

        export_page_image(doc, i, public_path, args.dpi)
        if package_path != public_path:
            package_path.write_bytes(public_path.read_bytes())

        ocr_text = "" if args.skip_ocr else run_ocr(public_path)
        part = classify_part(ocr_text, i)
        topics = classify_topics(ocr_text)
        ga_min, ga_max = extract_ga_range(ocr_text)
        title, section = extract_title_section(ocr_text)
        measurements = [float(m.replace(",", ".")) for m in MM_RE.findall(ocr_text)]
        rules = infer_rules(ocr_text, topics)
        hint = teaching_hint_from_page(part, topics, ocr_text)
        book_label = guess_book_page_label(ocr_text, page_no)

        page_id = f"blinov-p{page_no:03d}"
        entry = AtlasPage(
            id=page_id,
            page_number=page_no,
            book_page_label=book_label,
            image_href=f"/clinical-atlas/blinov/pages/{filename}",
            part=part,
            topics=topics,
            ga_weeks_min=ga_min,
            ga_weeks_max=ga_max,
            measurements_mm=measurements,
            title=title,
            section=section,
            ocr_text=ocr_text,
            rules=rules,
            teaching_hint=hint,
            quality="ocr" if ocr_text else "image_only",
        )
        pages.append(entry)
        for rule in rules:
            all_rules[rule["id"]] = rule

        print(f"[{page_no}/{total}] part={part} topics={','.join(topics)} ocr_chars={len(ocr_text)}")

    catalog = {
        "source": SOURCE_META,
        "parts": [
            {"id": "intro", "title": "Введение", "ga_weeks": None},
            {"id": "early", "title": "Ранняя беременность (4–11 нед.)", "ga_weeks": {"min": 4, "max": 11}},
            {
                "id": "anatomy_11_14",
                "title": "Нормальная топоанатомия плода (11–14 нед.)",
                "ga_weeks": {"min": 11, "max": 14},
            },
            {"id": "appendix", "title": "Приложение (протоколы 4–10 нед.)", "ga_weeks": {"min": 4, "max": 10}},
            {"id": "conclusion", "title": "Заключение", "ga_weeks": {"min": 11, "max": 14}},
        ],
        "page_count": len(pages),
        "generated_by": "scripts/import-blinov-atlas.py",
    }

    pages_payload = {
        "catalog": catalog,
        "pages": [asdict(p) for p in pages],
        "rules_index": list(all_rules.values()),
    }

    (DATA_OUT / "pages.json").write_text(
        json.dumps(pages_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    summary = {
        "pages": len(pages),
        "with_ocr": sum(1 for p in pages if p.ocr_text),
        "with_rules": sum(1 for p in pages if p.rules),
        "parts": {part: sum(1 for p in pages if p.part == part) for part in {p.part for p in pages}},
    }
    (DATA_OUT / "import-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\n=== import complete ===")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
