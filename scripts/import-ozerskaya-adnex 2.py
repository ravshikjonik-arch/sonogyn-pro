#!/usr/bin/env python3
"""Импорт методички Озерской И.А. — IOTA / O-RADS (часть 1) → JPG + OCR + JSON."""

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
    "/Users/yakrav7700/Desktop/Стандартизация УЗИ патологии придатков матки по IOTA, O-RADS 1 часть.pdf"
)
OCR_SWIFT = ROOT / "scripts" / "mac-vision-ocr.swift"
PUBLIC_PAGES = ROOT / "apps/web/public/clinical-atlas/ozerskaya/pages"
DATA_OUT = ROOT / "packages/adnex-education/data"

SOURCE_META = {
    "book_id": "ozerskaya-iota-orads-2024",
    "title": "Стандартизация УЗИ патологии придатков матки по IOTA, O-RADS",
    "author": "Озерская И.А.",
    "type": "Методические рекомендации",
    "part": 1,
    "usage_note": "Учебный слой SonoGyn Pro. Публикация фрагментов — с учётом авторских прав.",
}

CHAPTER_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("intro", re.compile(r"\bвведени", re.I)),
    ("iota", re.compile(r"\bIOTA\b|группы\s+IOTA|прост(ые|ых)\s+правил", re.I)),
    ("morphology", re.compile(r"тератом|геморрагическ|параовариальн|гидросальпинк|GI-RADS", re.I)),
    ("orads", re.compile(r"\bO-RADS\b|шкала\s+стратификации", re.I)),
    ("management", re.compile(r"тактика\s+ведения|рекомендаци", re.I)),
    ("conclusion", re.compile(r"\bзаключени|\bлитератур", re.I)),
]

TOPIC_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("septa", re.compile(r"перегород|многокамерн|однокамерн", re.I)),
    ("papillary", re.compile(r"папилляр", re.I)),
    ("doppler", re.compile(r"васкуляризац|допплер|балл", re.I)),
    ("shadow", re.compile(r"акустическ\w+\s+тен", re.I)),
    ("simple_rules", re.compile(r"прост\w+\s+правил|^[BM]\d", re.I | re.M)),
    ("teratoma", re.compile(r"тератом|дермоид", re.I)),
    ("hemorrhagic", re.compile(r"геморрагическ|желтого\s+тела", re.I)),
    ("orads_category", re.compile(r"O-RADS\s*[0-5]", re.I)),
]


@dataclass
class AdnexPage:
    id: str
    page_number: int
    image_href: str
    chapter: str
    topics: list[str]
    title: str | None
    ocr_text: str
    teaching_hint: str | None = None
    figure_refs: list[str] = field(default_factory=list)
    quality: str = "draft"


def run_ocr(image_path: Path) -> str:
    try:
        proc = subprocess.run(
            ["swift", str(OCR_SWIFT), str(image_path)],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return proc.stdout.strip() if proc.returncode == 0 else ""
    except (subprocess.TimeoutExpired, OSError):
        return ""


def classify_chapter(text: str, page_index: int) -> str:
    for name, pat in CHAPTER_PATTERNS:
        if pat.search(text):
            return name
    if page_index < 2:
        return "intro"
    if page_index < 14:
        return "iota"
    if page_index < 20:
        return "morphology"
    return "orads"


def classify_topics(text: str) -> list[str]:
    found = [n for n, p in TOPIC_PATTERNS if p.search(text)]
    return found or ["general"]


def extract_title(text: str) -> str | None:
    for ln in text.splitlines():
        ln = ln.strip()
        if 8 < len(ln) < 120 and not ln.isdigit():
            if re.search(r"IOTA|O-RADS|Введение|тератом|GI-RADS|Содержание", ln, re.I):
                return ln
    return None


def teaching_hint(chapter: str, topics: list[str], text: str) -> str | None:
    if "septa" in topics and re.search(r"неполн\w+\s+перегород", text, re.I):
        return (
            "Озерская/IOTA: неполная перегородка при смене плоскости → образование однокамерное. "
            "Не завышайте O-RADS из-за ложной многокамерности."
        )
    if "simple_rules" in topics or re.search(r"пять\s+простых\s+правил", text, re.I):
        return "IOTA Simple Rules: любой M-признак без B → подозрение на злокачественность; только B → доброкачественное."
    if "doppler" in topics:
        return "Цветовой балл IOTA 1–4 (Озерская, рис. 14). Балл 4 = M5 в простых правилах."
    if "teratoma" in topics:
        return "Типичная тератома: гиперэхогенный компонент с тенью, линии/точки волос, дермоидные бугорки."
    if "orads_category" in topics and chapter == "management":
        return "Тактика ведения — по наивысшей категории O-RADS при нескольких образованиях."
    return None


def figure_refs(text: str) -> list[str]:
    return re.findall(r"Рис\.\s*\d+", text, re.I)[:8]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--dpi", type=int, default=140)
    parser.add_argument("--skip-ocr", action="store_true")
    args = parser.parse_args()

    if not args.pdf.exists():
        sys.exit(f"PDF не найден: {args.pdf}")

    PUBLIC_PAGES.mkdir(parents=True, exist_ok=True)
    DATA_OUT.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(args.pdf))
    pages: list[AdnexPage] = []

    for i in range(doc.page_count):
        n = i + 1
        fname = f"page-{n:02d}.jpg"
        out = PUBLIC_PAGES / fname
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=fitz.Matrix(args.dpi / 72, args.dpi / 72), alpha=False)
        pix.save(str(out), output="jpeg", jpg_quality=85)

        ocr = "" if args.skip_ocr else run_ocr(out)
        chapter = classify_chapter(ocr, i)
        topics = classify_topics(ocr)
        entry = AdnexPage(
            id=f"ozerskaya-p{n:02d}",
            page_number=n,
            image_href=f"/clinical-atlas/ozerskaya/pages/{fname}",
            chapter=chapter,
            topics=topics,
            title=extract_title(ocr),
            ocr_text=ocr,
            teaching_hint=teaching_hint(chapter, topics, ocr),
            figure_refs=figure_refs(ocr),
            quality="ocr" if ocr else "image_only",
        )
        pages.append(entry)
        print(f"[{n}/{doc.page_count}] {chapter} {topics} ocr={len(ocr)}")

    payload = {
        "source": SOURCE_META,
        "chapters": [
            {"id": "intro", "title": "Введение"},
            {"id": "iota", "title": "Рекомендации IOTA"},
            {"id": "morphology", "title": "Морфология и GI-RADS"},
            {"id": "orads", "title": "O-RADS US"},
            {"id": "management", "title": "Тактика ведения"},
            {"id": "conclusion", "title": "Заключение"},
        ],
        "pages": [asdict(p) for p in pages],
    }
    (DATA_OUT / "pages.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("done", len(pages), "pages")


if __name__ == "__main__":
    main()
