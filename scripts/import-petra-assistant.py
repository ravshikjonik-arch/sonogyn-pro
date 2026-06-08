#!/usr/bin/env python3
"""Импорт карточек «помощник от петра.docx» → JSON для SonoGyn Pro."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX = Path("/Users/yakrav7700/Desktop/помощник от петра.docx")
OUT_GYN = ROOT / "apps/mobile/src/gynecology/obgynAssistantImportedGynecology.json"
OUT_OBS = ROOT / "apps/mobile/src/gynecology/obgynAssistantImportedObstetrics.json"

HEADER_ICD = re.compile(r"^([A-Z]\d{2}(?:\.\d+)?(?:\+)?\*?)\s*(.*)$")
ICD_START = re.compile(r"^([A-Z]\d{2}(?:\.\d+)?(?:\+)?\*?)")
SECTION_MARKERS = {
    "Обследования",
    "Консультации специалистов",
    "РЕКОМЕНДУЕМ",
    "НЕ РЕКОМЕНДУЕМ",
    "Медикаментозное лечение",
}
NOISE_SUBSTR = (
    "http",
    "UpToDate",
    "International evidence",
    "ESHRE",
    "medscape",
    "guideline",
    "Guidelines",
    "Клинические рекомендации",
    "www.",
)


def load_lines() -> list[str]:
    if not DOCX.exists():
        sys.exit(f"Файл не найден: {DOCX}")
    text = subprocess.check_output(
        ["textutil", "-convert", "txt", "-stdout", str(DOCX)],
        text=True,
        errors="replace",
    )
    return [ln.strip() for ln in text.splitlines()]


def is_bullet(line: str) -> bool:
    return line.startswith("•") or line.startswith("\t•")


def clean_bullet(line: str) -> str:
    return line.lstrip("•\t ").strip()


def is_noise(line: str) -> bool:
    if not line or len(line) < 3:
        return True
    lower = line.lower()
    if any(n.lower() in lower for n in NOISE_SUBSTR):
        return True
    if line.startswith("ФКР,") or line.startswith("ФКР "):
        return True
    return False


def slugify(mode: str, code: str, title: str) -> str:
    raw = f"{mode}-{code}-{title}".lower()
    raw = re.sub(r"[^a-zа-яё0-9]+", "-", raw, flags=re.I)
    return raw.strip("-")[:120]


def group_for_code(code: str, mode: str) -> str:
    if mode == "obstetrics":
        return "Акушерство"
    if code.startswith("A") or code.startswith("B"):
        return "Инфекции"
    if re.match(r"^D25|^D26|^D27|^D28", code):
        return "Доброкачественные образования"
    if code.startswith("E"):
        return "Эндокринология и обмен"
    if re.match(r"^N8", code):
        return "Матка, яичники, тазовое дно"
    if re.match(r"^N9", code):
        return "Цикл, менопауза, фертильность"
    if re.match(r"^N6", code):
        return "Молочная железа"
    if code.startswith("O"):
        return "Акушерство"
    if code.startswith("Z"):
        return "Консультации и наблюдение"
    return "Гинекология"


def find_detail_start(lines: list[str]) -> int:
    for i in range(len(lines) - 2):
        if lines[i + 1] == "Обследования" and HEADER_ICD.match(lines[i]):
            if i > 1000:
                return i
    return 1389


def find_obstetrics_start(lines: list[str], gyn_start: int) -> int:
    for i in range(gyn_start + 1000, len(lines) - 2):
        if lines[i + 1] == "Обследования" and lines[i].startswith("O"):
            return i
    for i, ln in enumerate(lines):
        if ln == "Акушерство" and i > gyn_start:
            return i
    return len(lines)


def parse_code_title(header: str) -> tuple[str, str] | None:
    m = HEADER_ICD.match(header.strip())
    if not m:
        return None
    code = m.group(1).rstrip(".")
    title = m.group(2).strip() or code
    title = re.sub(r"\s+", " ", title)
    return code, title


def resolve_header(lines: list[str], exam_idx: int) -> tuple[int, str] | None:
    """exam_idx — строка «Обследования»; заголовок может быть на 1–5 строк выше."""
    for j in range(exam_idx - 1, max(exam_idx - 6, -1), -1):
        if j < 0:
            break
        ln = lines[j]
        if not ln or ln in SECTION_MARKERS:
            continue
        if not ICD_START.match(ln):
            continue
        chunk = [ln]
        for k in range(j + 1, exam_idx):
            part = lines[k]
            if part and part not in SECTION_MARKERS:
                chunk.append(part)
        header = re.sub(r"\s+", " ", " ".join(chunk)).strip()
        if parse_code_title(header):
            return j, header
    return None


def find_block_starts(lines: list[str], start: int, end: int) -> list[tuple[int, str]]:
    blocks: list[tuple[int, str]] = []
    for i in range(start, min(end, len(lines))):
        if lines[i] != "Обследования":
            continue
        resolved = resolve_header(lines, i)
        if not resolved:
            continue
        header_idx, header = resolved
        blocks.append((i, header_idx, header))
    deduped: list[tuple[int, int, str]] = []
    seen_idx: set[int] = set()
    for exam_idx, header_idx, hdr in blocks:
        if header_idx in seen_idx:
            continue
        seen_idx.add(header_idx)
        deduped.append((exam_idx, header_idx, hdr))
    return deduped


def cap(items: list[str], limit: int = 48) -> list[str]:
    return [x for x in items if x][:limit]


def parse_block(lines: list[str], exam_start: int, end: int, mode: str, header_line: str) -> dict | None:
    parsed = parse_code_title(header_line)
    if not parsed:
        return None
    code, title = parsed

    labs: list[str] = []
    instrumental: list[str] = []
    ultrasound: list[str] = []
    consultations: list[str] = []
    recommended: list[str] = []
    not_recommended: list[str] = []
    treatment: list[str] = []

    section: str | None = None
    exam_sub: str | None = None

    for ln in lines[exam_start : end]:
        if ln in SECTION_MARKERS:
            section = ln
            exam_sub = None
            continue
        if section is None:
            continue
        if is_noise(ln):
            continue

        if is_bullet(ln):
            item = clean_bullet(ln)
            if not item or is_noise(item):
                continue
            if section == "Обследования":
                if exam_sub:
                    prefix = exam_sub if len(exam_sub) < 80 else exam_sub[:77] + "…"
                    item = f"{prefix}: {item}"
                sub_lower = (exam_sub or "").lower()
                if "инструмент" in sub_lower:
                    if "узи" in item.lower() or "ультразв" in item.lower() or "фолликул" in item.lower():
                        ultrasound.append(item)
                    instrumental.append(item)
                elif "узи" in sub_lower or "ультразв" in sub_lower:
                    ultrasound.append(item)
                else:
                    labs.append(item)
            elif section == "Консультации специалистов":
                consultations.append(item)
            elif section == "РЕКОМЕНДУЕМ":
                recommended.append(item)
            elif section == "НЕ РЕКОМЕНДУЕМ":
                not_recommended.append(item)
            elif section == "Медикаментозное лечение":
                treatment.append(item)
        else:
            if section == "Обследования" and len(ln) < 140:
                exam_sub = ln
            elif section == "РЕКОМЕНДУЕМ" and len(ln) < 500:
                recommended.append(ln)
            elif section == "НЕ РЕКОМЕНДУЕМ" and len(ln) < 500:
                not_recommended.append(ln)
            elif section == "Медикаментозное лечение" and len(ln) < 300:
                treatment.append(ln)

    red_flags = [
        x
        for x in recommended
        if any(k in x.lower() for k in ("срочн", "красн", "госпитал", "неотлож", "экстрен", "перитонит", "кровотеч"))
    ][:12]
    if not red_flags:
        red_flags = [
            "Острая боль, гемодинамическая нестабильность, обильное кровотечение.",
            "Подозрение на осложнение — очный осмотр / стационар по клинике.",
        ]

    routing = [
        x
        for x in recommended + consultations
        if any(k in x.lower() for k in ("консультац", "направ", "стационар", "хирург", "репродукт", "уролог", "онколог"))
    ][:12]
    if not routing:
        routing = ["Маршрут по локальному протоколу и тяжести состояния."]

    uz_from_rec = [x for x in recommended if "узи" in x.lower() or "ультразв" in x.lower()]
    ultrasound = cap(list(dict.fromkeys(ultrasound + uz_from_rec)), 24)
    diagnostics = cap([x for x in recommended if x not in treatment[:5]], 32)

    card = {
        "id": slugify(mode, code, title),
        "mode": mode,
        "code": code,
        "title": title,
        "aliases": list(dict.fromkeys([code, title]))[:8],
        "group": group_for_code(code, mode),
        "dailyUse": recommended[0]
        if recommended
        else f"Маршрут обследования и тактики по МКБ {code} — помощник врача-гинеколога.",
        "visitChecklist": cap(
            [
                "Жалобы, анамнез, срок/цикл/беременность, текущая терапия.",
                "Оценить срочность и красные флаги до планового дообследования.",
                "Сопоставить клинику с результатами анализов и УЗИ.",
            ],
            6,
        ),
        "ultrasoundFocus": ultrasound
        if ultrasound
        else ["УЗИ органов малого таза / по локализации процесса — по показаниям из маршрута."],
        "diagnostics": diagnostics if diagnostics else ["Дифференциальная диагностика — по блоку «Рекомендуем» в документе."],
        "laboratoryWorkup": cap(labs, 40),
        "instrumentalInvestigations": cap(instrumental, 24),
        "treatmentRoute": cap(treatment if treatment else [x for x in recommended if "лечен" in x.lower() or "терап" in x.lower()], 40),
        "redFlags": red_flags,
        "protocolTemplate": [
            f"МКБ: {code}. {title}.",
            "Жалобы и контекст: __.",
            "УЗИ / осмотр: ключевые находки по маршруту.",
            "Заключение: соответствует/не соответствует; тактика по КР и клинике.",
        ],
        "routing": routing,
        "specialistConsultations": cap(consultations, 16),
        "notRecommended": cap(not_recommended, 24),
        "sourceNote": "База помощника врача-гинеколога · полный маршрут: обследования, рекомендации, лечение.",
        "depth": "expanded",
    }

    if not labs and not recommended and not treatment:
        return None
    return card


def main() -> None:
    lines = load_lines()
    gyn_start = find_detail_start(lines)
    obs_start = find_obstetrics_start(lines, gyn_start)

    gyn_blocks = find_block_starts(lines, gyn_start, obs_start)
    obs_blocks = find_block_starts(lines, obs_start, len(lines))

    gyn_cards: list[dict] = []
    obs_cards: list[dict] = []
    seen: set[str] = set()

    for mode, blocks, region_end, bucket in (
        ("gynecology", gyn_blocks, obs_start, gyn_cards),
        ("obstetrics", obs_blocks, len(lines), obs_cards),
    ):
        for idx, (exam_start, _header_idx, header) in enumerate(blocks):
            end = blocks[idx + 1][0] if idx + 1 < len(blocks) else region_end
            card = parse_block(lines, exam_start, end, mode, header)
            if not card:
                continue
            key = f"{card['mode']}:{card['code']}"
            if key in seen:
                continue
            seen.add(key)
            bucket.append(card)

    gyn_cards.sort(key=lambda c: (c["code"], c["title"]))
    obs_cards.sort(key=lambda c: (c["code"], c["title"]))

    OUT_GYN.parent.mkdir(parents=True, exist_ok=True)
    OUT_GYN.write_text(json.dumps(gyn_cards, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_OBS.write_text(json.dumps(obs_cards, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(f"Wrote {len(gyn_cards)} gynecology → {OUT_GYN} ({OUT_GYN.stat().st_size // 1024} KB)")
    print(f"Wrote {len(obs_cards)} obstetrics → {OUT_OBS} ({OUT_OBS.stat().st_size // 1024} KB)")
    print(f"  block starts: gyn={len(gyn_blocks)}, obs={len(obs_blocks)}")


if __name__ == "__main__":
    main()
