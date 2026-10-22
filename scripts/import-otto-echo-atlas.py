#!/usr/bin/env python3
"""Импорт Otto Practice of Clinical Echocardiography 5ed (RU) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-echo")
DATA_OUT = ROOT / "packages/clinical-echocardiography-atlas/data/atlas.ru.json"
GLOSSARY_OUT = ROOT / "apps/web/public/clinical-content/otto-echo-glossary.md"

PART_RU: dict[str, str] = {
    "lab-technique": "Лаборатория и техника (3D, ЧПЭхоКГ, POCUS)",
    "lv-assessment": "ЛЖ: систола, strain, диастола",
    "ischemia-stress": "ИБС, ОКС, стресс-ЭхоКГ",
    "valves": "Клапаны и протезы",
    "cm-pericard-mcs": "КМП, перикард, трансплантация, MCS",
    "rv-pulmonary": "ПЖ и лёгочная гипертензия",
    "aorta-systemic": "Аорта и системные заболевания",
    "special-populations": "Спорт, соединительная ткань, возраст",
    "arrhythmia-tumor": "Аритмии, эмболии, опухоли",
    "pregnancy-congenital": "Беременность и ВПС (основы)",
    "congenital-advanced": "Сложные ВПС и Fontan",
}


def part_id(n: int) -> str:
    if n <= 6:
        return "lab-technique"
    if n <= 10:
        return "lv-assessment"
    if n <= 14:
        return "ischemia-stress"
    if n <= 24:
        return "valves"
    if n <= 30:
        return "cm-pericard-mcs"
    if n <= 33:
        return "rv-pulmonary"
    if n <= 35:
        return "aorta-systemic"
    if n in (37, 38, 39):
        return "special-populations"
    if n == 36:
        return "congenital-advanced"
    if n <= 42:
        return "arrhythmia-tumor"
    if n <= 45:
        return "pregnancy-congenital"
    return "congenital-advanced"


def chapter_slug(n: int) -> str:
    return f"glava-{n:02d}"


CHAPTER36_TITLE_RU = (
    "Врождённые пороки сердца у взрослых: общие принципы эхокардиографии"
)


def parse_title_ru(md: str, n: int) -> str:
    for line in md.splitlines():
        line = line.strip()
        m = re.match(r"^#\s+Глава\s+\d+\.\s+(.+)$", line)
        if m:
            return m.group(1).strip()
    if n == 36:
        return CHAPTER36_TITLE_RU
    return f"Глава {n}"


def strip_preamble(lines: list[str]) -> list[str]:
    out: list[str] = []
    skipped_title = False
    for line in lines:
        if not skipped_title and line.strip().startswith("# Глава"):
            skipped_title = True
            continue
        if skipped_title and not out and line.strip().startswith("*"):
            continue
        out.append(line)
    return out


def split_sections(body_lines: list[str]) -> list[dict]:
    sections: list[dict] = []
    current_heading = "Введение"
    current_lines: list[str] = []

    def flush() -> None:
        nonlocal current_lines, current_heading
        text = "\n".join(current_lines).strip()
        if text or current_heading != "Введение":
            sections.append({"headingRu": current_heading, "bodyMarkdownRu": text})
        current_lines = []

    for line in body_lines:
        m2 = re.match(r"^##\s+(.+)$", line.strip())
        m3 = re.match(r"^###\s+(.+)$", line.strip())
        if m2:
            flush()
            current_heading = m2.group(1).strip()
            continue
        if m3 and not current_lines and current_heading == "Введение":
            flush()
            current_heading = m3.group(1).strip()
            continue
        current_lines.append(line)

    flush()
    return [s for s in sections if s["bodyMarkdownRu"] or s["headingRu"] != "Введение"]


def extract_summary_bullets(sections: list[dict], limit: int = 12) -> list[str]:
    bullets: list[str] = []
    for sec in sections:
        for line in sec["bodyMarkdownRu"].splitlines():
            t = line.strip()
            if t.startswith("- ") or t.startswith("* "):
                bullets.append(t[2:].strip())
            elif re.match(r"^\d+\.\s", t):
                bullets.append(re.sub(r"^\d+\.\s", "", t).strip())
            if len(bullets) >= limit:
                return bullets
    return bullets


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", type=Path, default=DEFAULT_BOOK)
    args = parser.parse_args()
    book: Path = args.book
    index_path = book / "extracted/index.json"
    translated_dir = book / "translated"
    if not index_path.is_file():
        raise SystemExit(f"Нет {index_path}")

    chapters_meta = json.loads(index_path.read_text(encoding="utf-8"))
    glossary_path = translated_dir / "00-glossary.md"
    glossary_md = glossary_path.read_text(encoding="utf-8") if glossary_path.is_file() else ""

    part_order: list[str] = []
    chapters: list[dict] = []
    missing_ru: list[int] = []

    for ch in chapters_meta:
        n = int(ch["n"])
        pid = part_id(n)
        if pid not in part_order:
            part_order.append(pid)

        ru_path = translated_dir / f"{n:02d}.md"
        if ru_path.is_file():
            raw = ru_path.read_text(encoding="utf-8")
            title_ru = parse_title_ru(raw, n)
            body_lines = strip_preamble(raw.splitlines())
            sections = split_sections(body_lines)
            summary = extract_summary_bullets(sections)
        else:
            missing_ru.append(n)
            title_ru = parse_title_ru("", n)
            if n == 36:
                title_ru = CHAPTER36_TITLE_RU
            en_title = (ch.get("title") or "").strip()
            if en_title and re.match(r"^Глава\s+\d+$", title_ru):
                title_ru = en_title
            sections = [
                {
                    "headingRu": "Перевод в работе",
                    "bodyMarkdownRu": (
                        "Русский перевод этой главы пока не добавлен в `translated/`. "
                        "Оригинал: `extracted/` и PDF Otto 5ed."
                    ),
                }
            ]
            summary = []

        chapters.append(
            {
                "slug": chapter_slug(n),
                "chapterNum": n,
                "titleRu": title_ru,
                "titleEn": ch.get("title", ""),
                "section": pid,
                "sectionRu": PART_RU.get(pid, pid),
                "printStart": ch.get("pdf_start"),
                "printEnd": ch.get("pdf_end"),
                "summaryRu": summary,
                "sections": sections,
                "hasTranslation": ru_path.is_file(),
            }
        )

    doc = {
        "meta": {
            "bookId": "otto-clinical-echocardiography-5ed-ru",
            "titleRu": "Клиническая эхокардиография (Otto, 5-е изд., RU)",
            "sourceEn": "Catherine M. Otto, Practice of Clinical Echocardiography, 5th ed., 2016 (Elsevier)",
            "disclaimerRu": (
                "Учебный перевод SonoGyn Pro для врачей УЗИ/кардиологов. Термины — по глоссарию ASE/ESC "
                "и `00-glossary.md`; клинические решения — по актуальным ESC/ASE guidelines и локальным КР. "
                "Не заменяет очное заключение эхокардиографии."
            ),
            "chapterCount": len(chapters),
            "translatedChapterCount": sum(1 for c in chapters if c["hasTranslation"]),
            "glossaryHref": "/clinical-content/otto-echo-glossary.md",
        },
        "sections": [{"id": pid, "titleRu": PART_RU.get(pid, pid)} for pid in part_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    if glossary_md:
        GLOSSARY_OUT.parent.mkdir(parents=True, exist_ok=True)
        GLOSSARY_OUT.write_text(glossary_md, encoding="utf-8")
    print(f"Записано: {DATA_OUT}")
    print(f"Глав: {len(chapters)}, с переводом: {doc['meta']['translatedChapterCount']}")
    if missing_ru:
        print("Без RU:", ", ".join(str(x) for x in missing_ru))


if __name__ == "__main__":
    main()
