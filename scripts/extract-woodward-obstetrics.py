#!/usr/bin/env python3
"""Extract Woodward Obstetrics 4ed pathology entries into medical-knowledge JSON."""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF_DEFAULT = Path.home() / "Desktop" / "Diagnostic Imaging. Obstetrics (Woodward) 4 ed (2021).pdf"
OUT_DIR = ROOT / "medical-knowledge"

SECTION_TO_FILE: dict[str, str] = {
    "SECTION 1": "first-trimester",
    "SECTION 2": "brain",
    "SECTION 3": "spine",
    "SECTION 4": "face-neck",
    "SECTION 5": "chest",
    "SECTION 6": "heart",
    "SECTION 7": "gastrointestinal",
    "SECTION 8": "genitourinary",
    "SECTION 9": "musculoskeletal",
    "SECTION 10": "placenta",
    "SECTION 11": "multiple-gestation",
    "SECTION 12": "aneuploidy",
    "SECTION 13": "syndromes",
    "SECTION 14": "infection",
    "SECTION 15": "growth-wellbeing",
    "SECTION 16": "maternal-conditions",
}

MODULE_RU: dict[str, str] = {
    "first-trimester": "I триместр",
    "brain": "Головной мозг",
    "spine": "Позвоночник",
    "face-neck": "Лицо и шея",
    "chest": "Грудная клетка",
    "heart": "Сердце",
    "gastrointestinal": "ЖКТ и брюшная стенка",
    "genitourinary": "Мочеполовая система",
    "musculoskeletal": "Опорно-двигательная система",
    "placenta": "Плацента, оболочки, пуповина",
    "multiple-gestation": "Многоплодная беременность",
    "aneuploidy": "Анеуплоидии",
    "syndromes": "Синдромы и мультисистемные нарушения",
    "infection": "Инфекции",
    "growth-wellbeing": "Рост, жидкость, состояние плода",
    "maternal-conditions": "Материнские состояния",
}

SKIP_TITLE_PATTERNS = (
    "Embryology and Anatomy",
    "Approach to",
    "Approach to the",
    "Bone Length Charts",
    "Blalock-Taussig",
    "Norwood Procedure",
    "Glenn Procedure",
    "Fontan Procedure",
    "Congenital Heart Disease Surgery",
)

BLOCK_HEADERS = (
    "TERMINOLOGY",
    "IMAGING",
    "TOP DIFFERENTIAL DIAGNOSES",
    "PATHOLOGY",
    "CLINICAL ISSUES",
    "DIAGNOSTIC CHECKLIST",
    "GENETICS",
    "EPIDEMIOLOGY",
    "PROGNOSIS",
    "TREATMENT",
    "COMPLICATIONS",
)


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text[:80] or "entry"


@dataclass
class ParsedEntry:
    section_key: str
    book_page: int
    title_en: str
    blocks: dict[str, list[str]] = field(default_factory=dict)


def parse_toc_sections(text: str) -> dict[str, list[tuple[int, str]]]:
    """Parse TOC lines like '100 Agenesis/Dysgenesis of the Corpus Callosum'."""
    current = None
    mapping: dict[str, list[tuple[int, str]]] = {k: [] for k in SECTION_TO_FILE}

    for raw in text.splitlines():
        line = raw.strip()
        m_sec = re.match(r"^SECTION\s+(\d+):?\s*(.*)$", line, re.I)
        if m_sec:
            num = m_sec.group(1)
            current = f"SECTION {num}"
            continue
        if not current or current not in mapping:
            continue
        m_entry = re.match(r"^(\d{1,4})\s+(.+)$", line)
        if not m_entry:
            continue
        page = int(m_entry.group(1))
        title = m_entry.group(2).strip()
        if any(p in title for p in SKIP_TITLE_PATTERNS):
            continue
        if title.upper().startswith("PERTINENT DIFFERENTIAL"):
            continue
        mapping[current].append((page, title))

    return mapping


def split_key_facts(text: str) -> dict[str, list[str]]:
    blocks: dict[str, list[str]] = {}
    current = "GENERAL"
    blocks[current] = []

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("(Left)") or line.startswith("(Right)"):
            continue
        if line in BLOCK_HEADERS:
            current = line
            blocks.setdefault(current, [])
            continue
        if line == "KEY FACTS":
            continue
        blocks.setdefault(current, []).append(line)

    return {k: v for k, v in blocks.items() if v}


def bullets(blocks: dict[str, list[str]], *keys: str) -> list[str]:
    out: list[str] = []
    for key in keys:
        for line in blocks.get(key, []):
            cleaned = re.sub(r"^[•○\-]\s*", "", line).strip()
            if cleaned:
                out.append(cleaned)
    return out


def join_block(blocks: dict[str, list[str]], key: str) -> str:
    return " ".join(blocks.get(key, [])).strip()


def map_entry(section_key: str, book_page: int, title_en: str, blocks: dict[str, list[str]]) -> dict:
    terminology = join_block(blocks, "TERMINOLOGY")
    imaging = bullets(blocks, "IMAGING")
    mri = [x for x in imaging if re.search(r"\bMR\b|MRI|fetal MR", x, re.I)]
    us = [x for x in imaging if x not in mri]
    doppler = [x for x in imaging if re.search(r"doppler|PI|RI|S/D|MCA|UA|DV|UTA", x, re.I)]

    pathology = bullets(blocks, "PATHOLOGY")
    genetics = bullets(blocks, "GENETICS") + [
        x for x in pathology if re.search(r"chromosom|genetic|syndrom|karyotype|aneuploid", x, re.I)
    ]
    associated = [
        x
        for x in pathology + bullets(blocks, "CLINICAL ISSUES")
        if re.search(r"associated|anomal|CNS|body|other", x, re.I)
    ]

    clinical = bullets(blocks, "CLINICAL ISSUES")
    checklist = bullets(blocks, "DIAGNOSTIC CHECKLIST")

    follow_up = [x for x in clinical if re.search(r"recommended|follow|karyotype|MR|echo|amnio|serial", x, re.I)]
    red_flags = checklist + [x for x in clinical if re.search(r"missed|misdiagn|critical|urgent", x, re.I)]

    delivery = " ".join(
        x
        for x in clinical
        if re.search(r"deliver|cesarean|C-section|termination|pregnancy management", x, re.I)
    )
    postnatal = " ".join(
        x for x in clinical if re.search(r"postnatal|after birth|neonatal|surgery|repair", x, re.I)
    )
    prognosis = join_block(blocks, "PROGNOSIS") or join_block(blocks, "COMPLICATIONS")

    entry_id = slugify(title_en)

    return {
        "id": entry_id,
        "name": title_en,  # filled with RU pass downstream
        "nameEn": title_en,
        "category": MODULE_RU.get(SECTION_TO_FILE[section_key], section_key),
        "bookSection": section_key,
        "bookPage": book_page,
        "definition": terminology or title_en,
        "epidemiology": join_block(blocks, "EPIDEMIOLOGY"),
        "embryology": "",
        "ultrasound_findings": us,
        "doppler_findings": doppler,
        "mri_findings": mri,
        "associated_anomalies": associated,
        "genetic_associations": genetics,
        "differential_diagnosis": bullets(blocks, "TOP DIFFERENTIAL DIAGNOSES"),
        "red_flags": red_flags,
        "follow_up": follow_up or clinical,
        "prognosis": prognosis,
        "delivery_recommendations": delivery,
        "postnatal_management": postnatal,
        "references": [
            "Woodward PJ, et al. Diagnostic Imaging: Obstetrics. 4th ed. Elsevier; 2021.",
            f"Book p.{book_page}: {title_en}",
        ],
        "sourceBlocks": blocks,
    }


def extract_pdf_entries(pdf_path: Path) -> dict[str, list[dict]]:
    reader = PdfReader(str(pdf_path))

    toc_text = "\n".join(
        (reader.pages[i].extract_text() or "") for i in range(12, 20)
    )
    toc_map = parse_toc_sections(toc_text)

    # Index book page -> PDF page via inline book page numbers in content pages
    book_to_pdf: dict[int, int] = {}
    page_pattern = re.compile(r"^(\d{1,4})\s*$")

    for pdf_idx in range(24, len(reader.pages)):
        text = reader.pages[pdf_idx].extract_text() or ""
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        for i, line in enumerate(lines[:6]):
            if page_pattern.match(line):
                book_page = int(line)
                # title usually follows within 2 lines
                if i + 1 < len(lines) and "KEY FACTS" in text:
                    book_to_pdf[book_page] = pdf_idx + 1

    by_file: dict[str, list[dict]] = {v: [] for v in SECTION_TO_FILE.values()}

    for section_key, items in toc_map.items():
        file_id = SECTION_TO_FILE.get(section_key)
        if not file_id:
            continue
        for book_page, title_en in items:
            pdf_page = book_to_pdf.get(book_page)
            blocks: dict[str, list[str]] = {}
            if pdf_page:
                text = reader.pages[pdf_page - 1].extract_text() or ""
                if "KEY FACTS" in text:
                    start = text.find("KEY FACTS")
                    body = text[start:]
                    # trim captions
                    body = re.split(r"\(Left\)", body)[0]
                    blocks = split_key_facts(body)

            entry = map_entry(section_key, book_page, title_en, blocks)
            by_file[file_id].append(entry)

    return by_file


def main() -> None:
    pdf_path = PDF_DEFAULT
    if not pdf_path.exists():
        alt = ROOT / "docs" / "books" / "Diagnostic-Imaging-Obstetrics-2021.pdf"
        pdf_path = alt

    if not pdf_path.exists():
        raise SystemExit(f"PDF not found: {pdf_path}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = extract_pdf_entries(pdf_path)
    today = date.today().isoformat()

    manifest = {
        "sourcePdf": str(pdf_path),
        "extractedAt": today,
        "files": {},
    }

    for file_id, entries in data.items():
        payload = {
            "module": file_id,
            "moduleRu": MODULE_RU[file_id],
            "source": {
                "title": "Diagnostic Imaging: Obstetrics",
                "edition": "4th",
                "authors": [
                    "Paula J. Woodward",
                    "Anne Kennedy",
                    "Roya Sohaey",
                    "Janice L. B. Byrne",
                    "Michael D. Puchalski",
                    "Brian L. Shaffer",
                    "Emily Edwards",
                    "Priyanka Jha",
                    "Whitnee Hogan",
                ],
            },
            "version": "1.0.0",
            "extractedAt": today,
            "entries": entries,
        }
        out_path = OUT_DIR / f"{file_id}.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        manifest["files"][file_id] = {
            "path": f"{file_id}.json",
            "count": len(entries),
            "moduleRu": MODULE_RU[file_id],
        }
        print(f"✓ {file_id}.json — {len(entries)} entries")

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nTotal entries: {sum(len(v) for v in data.values())}")


if __name__ == "__main__":
    main()
