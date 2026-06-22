"""Rule-first extraction of O-RADS US v2022 features from Russian free text / voice transcript."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

DISCLAIMER = (
    "Черновик протокола и извлечённые признаки — клиническая поддержка (CDS). "
    "Не является диагнозом. Окончательное заключение и O-RADS — за врачом по гайдлайнам ACR O-RADS US v2022."
)


@dataclass
class FeatureHit:
    key: str
    value: Any
    confidence: str
    source_span: str | None = None


@dataclass
class ExtractionResult:
    extracted: dict[str, Any] = field(default_factory=dict)
    features: list[FeatureHit] = field(default_factory=list)
    missing_fields: list[str] = field(default_factory=list)


def _norm(text: str) -> str:
    t = text.lower().replace("ё", "е")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _mm(text: str) -> list[float]:
    return [float(m) for m in re.findall(r"(\d+(?:[.,]\d+)?)\s*(?:мм|mm)\b", text)]


def _add(result: ExtractionResult, key: str, value: Any, confidence: str, span: str | None = None) -> None:
    if key in result.extracted and result.extracted[key] is not None:
        return
    result.extracted[key] = value
    result.features.append(FeatureHit(key=key, value=value, confidence=confidence, source_span=span))


def extract_orads_features(text: str, age_years: int | None = None, menopause: str | None = None) -> ExtractionResult:
    raw = text.strip()
    t = _norm(raw)
    result = ExtractionResult()

    if age_years is not None:
        _add(result, "ageYears", age_years, "high")
    else:
        m = re.search(r"(?:возраст|лет)\s*[:—]?\s*(\d{2})", t)
        if m:
            _add(result, "ageYears", int(m.group(1)), "medium", m.group(0))

    if menopause:
        _add(result, "menopause", menopause, "high")
    elif re.search(r"\bпостменопауз", t):
        _add(result, "menopause", "post", "high", "постменопауза")
    elif re.search(r"\bпременопауз", t):
        _add(result, "menopause", "pre", "high", "пременопауза")

    if re.search(r"\bвнеяичник|extraovarian|параовари", t):
        _add(result, "localization", "extraovarian", "high")
    elif re.search(r"\bяичник|овари|adnex", t):
        _add(result, "localization", "ovarian", "medium")

    if re.search(r"\bфолликул|фолликуляр", t):
        _add(result, "lesionKind", "physiological", "high")
        _add(result, "physiologicalType", "follicle", "high")
    elif re.search(r"\bжелтое тело|кorpus luteum|корпус люте", t):
        _add(result, "lesionKind", "physiological", "high")
        _add(result, "physiologicalType", "corpus_luteum", "high")
    elif re.search(r"\bобразован", t):
        _add(result, "lesionKind", "nonphysiological", "medium")

    if re.search(r"\bунилокуляр|однокамерн|1 камер", t):
        _add(result, "structure", "unilocular", "high")
    elif re.search(r"\bмультилокуляр|многокамерн|мультикамерн", t):
        _add(result, "structure", "multilocular", "high")
    elif re.search(r"\bсолидн|плотн(ое|ый) образован", t):
        _add(result, "structure", "solid", "high")

    if re.search(r"\bэндометриом|шоколад", t):
        _add(result, "unilocularSubtype", "endometrioma", "high")
    elif re.search(r"\bдерmoid|терато", t):
        _add(result, "unilocularSubtype", "dermoid", "high")
    elif re.search(r"\bгеморраг|кровян", t):
        _add(result, "unilocularSubtype", "hemorrhagic", "medium")
    elif re.search(r"\bпрост(ой|ая) кист", t):
        _add(result, "unilocularSubtype", "simple_cyst", "high")

    if re.search(r"\bсолидн(ый|ая) компонент|солидные включен", t):
        _add(result, "solidComponent", True, "high")
    if re.search(r"\bбез солид|солид.*нет", t):
        _add(result, "solidComponent", False, "high")

    pap = re.search(r"\b(\d+)\s*(?:бугор|папилл|pap)", t)
    if pap:
        n = int(pap.group(1))
        count = "4plus" if n >= 4 else str(n)
        _add(result, "papillaryProjectionCount", count, "high", pap.group(0))
    elif re.search(r"\bпапилл|бугорк", t):
        _add(result, "papillaryProjectionCount", "1", "medium")

    if re.search(r"\bасцит", t):
        _add(result, "ascites", True, "high")
    if re.search(r"\bперитонеальн.*узл", t):
        _add(result, "peritonealNodules", True, "high")

    if re.search(r"\bcolor score\s*4|cs\s*4|цвет.*4", t):
        _add(result, "iotaColorScore", "4", "high")
    elif re.search(r"\bcolor score\s*3|cs\s*3", t):
        _add(result, "iotaColorScore", "3", "medium")

    if re.search(r"\bанэхоген|anechoic", t):
        _add(result, "echogenicity", "anechoic", "high")
    elif re.search(r"\bгипоэхоген", t):
        _add(result, "echogenicity", "hypo", "high")
    elif re.search(r"\bгиперэхоген", t):
        _add(result, "echogenicity", "hyper", "medium")

    sizes = _mm(t)
    if sizes:
        sizes_sorted = sorted(sizes, reverse=True)
        if len(sizes_sorted) >= 1:
            _add(result, "lengthMm", sizes_sorted[0], "high", f"{sizes_sorted[0]} мм")
        if len(sizes_sorted) >= 2:
            _add(result, "widthMm", sizes_sorted[1], "medium")
        if len(sizes_sorted) >= 3:
            _add(result, "heightMm", sizes_sorted[2], "medium")

    # Missing critical fields for wizard prefill
    required = ["localization", "structure"]
    for req in required:
        if req not in result.extracted:
            result.missing_fields.append(req)

    return result


def build_protocol_draft(text: str, extracted: dict[str, Any]) -> str:
    loc = extracted.get("localization")
    loc_ru = {"ovarian": "яичник", "extraovarian": "внеяичниковое"}.get(loc, "придатки")
    struct = extracted.get("structure")
    struct_ru = {
        "unilocular": "унилокулярное",
        "multilocular": "мультилокулярное",
        "solid": "солидное",
    }.get(struct, "образование")

    size_parts = []
    for k, label in [("lengthMm", "L"), ("widthMm", "W"), ("heightMm", "H")]:
        if extracted.get(k):
            size_parts.append(f"{label} {extracted[k]} мм")
    size_line = ", ".join(size_parts) if size_parts else "размеры уточнить"

    lines = [
        "УЗИ органов малого таза (черновик по диктовке):",
        f"В области {loc_ru}: {struct_ru} образование, {size_line}.",
    ]

    if extracted.get("unilocularSubtype") == "endometrioma":
        lines.append("Эхоструктура однородная гипоэхогенная («стекло матового»), без внутренних перегородок — картина эндометриомы (уточнить).")
    if extracted.get("solidComponent"):
        lines.append("Отмечается солидный компонент — оценить по O-RADS US v2022.")
    if extracted.get("papillaryProjectionCount"):
        lines.append(f"Папиллярные бугорки: {extracted['papillaryProjectionCount']} (уточнить морфологию).")
    if extracted.get("ascites"):
        lines.append("Асцит — клиническая корреляция, исключить злокачественный процесс.")
    if extracted.get("iotaColorScore"):
        lines.append(f"Color score (IOTA): {extracted['iotaColorScore']}.")

    lines.append("")
    lines.append("Заключение (черновик): см. калькулятор O-RADS после верификации признаков врачом.")
    lines.append(f"\nИсходная диктовка: {text[:500]}{'…' if len(text) > 500 else ''}")
    return "\n".join(lines)


def heuristic_orads_hint(extracted: dict[str, Any]) -> str | None:
    """Non-binding hint — final category must come from @repo/orads-us wizard."""
    if extracted.get("physiologicalType") in ("follicle", "corpus_luteum"):
        return "O-RADS 1 (физиологическое) — проверить цикл/менопаузу"
    if extracted.get("unilocularSubtype") == "simple_cyst":
        size = extracted.get("lengthMm") or extracted.get("widthMm") or 0
        if size and float(size) < 30:
            return "O-RADS 2 (простая киста <3 см) — уточнить менопаузу"
    if extracted.get("unilocularSubtype") == "endometrioma":
        return "O-RADS 3 (типичная эндометриома) — подтвердить типичные признаки"
    if extracted.get("solidComponent") or extracted.get("structure") == "solid":
        return "O-RADS ≥4 — солидный компонент, нужна полная классификация"
    if extracted.get("ascites") or extracted.get("peritonealNodules"):
        return "Подозрение на O-RADS 5 — асцит/перитонеальные импланты, срочная верификация"
    return None
