#!/usr/bin/env python3
"""Apply Russian titles and clinical glossary to Woodward knowledge JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = ROOT / "medical-knowledge"

GLOSSARY: list[tuple[str, str]] = [
    (r"gestational sac", "плодное яйцо (ПЯ)"),
    (r"crown-rump length", "копчико-теменной размер (КТР)"),
    (r"yolk sac", "желточный мешок (ЖМ)"),
    (r"cardiac activity", "сердечная активность"),
    (r"color Doppler", "цветовой допpler (ЦДК)"),
    (r"polyhydramnios", "многоводие"),
    (r"oligohydramnios", "маловодие"),
    (r"hydrops", "водянка плода (гидропс)"),
    (r"ventriculomegaly", "вентрикуломегалия"),
    (r"cavum septi pellucidi", "полость прозрачной перегородки (CSP)"),
    (r"corpus callosum", "мозолистое тело (МТ)"),
    (r"fetal MR\b", "МРТ плода"),
    (r"\bMR\b", "МР"),
    (r"karyotype", "кариотипирование"),
    (r"intrauterine pregnancy", "внутриматочная беременность (ВМБ)"),
    (r"mean sac diameter", "средний диаметр плодного мешка (СДПМ)"),
    (r"holoprosencephaly", "гольопrosencephalia / holoprosencephaly"),
    (r"septo-optic dysplasia", "dysplasia septo-optica / SOD"),
    (r"echogenic", "эхогенный"),
    (r"hypoechoic", "гипоэхогенный"),
    (r"anechoic", "анэхогенный"),
    (r"placenta accreta", "placenta accreta spectrum (ПАС)"),
    (r"follow-up", "динамическое наблюдение"),
    (r"amniocentesis", "амниоцентез"),
    (r"chorionic villus sampling", "биопсия хориона (CVS)"),
    (r"cell-free fetal DNA", "ПДН плода (NIPT/cfDNA)"),
    (r"nuchal translucency", "толщина воротникового пространства (ТВП)"),
    (r"nasal bone", "носовая кость"),
    (r"ductus venosus", "венозный проток (DV)"),
    (r"tricuspid regurgitation", "трикуспидальная регurgитация"),
    (r"fetal growth restriction", "задержка роста плода (ЗРП/FGR)"),
    (r"microcephaly", "микроцефалия"),
    (r"macrocephaly", "макроцефалия"),
    (r"hydronephrosis", "гидронефроз"),
    (r"congenital diaphragmatic hernia", "врождённая диафрагмальная грыжа (CDH)"),
    (r"echogenic bowel", "эхогенный кишечник"),
    (r"intracardiac echogenic focus", "эхогенный фокус в сердце (EIF)"),
    (r"short femur", "укорочение бедренной кости"),
    (r"short humerus", "укорочение плечевой кости"),
    (r"fetal echo", "фetal echocardiography / эхокардиография плода"),
]

LIST_FIELDS = [
    "ultrasound_findings",
    "doppler_findings",
    "mri_findings",
    "associated_anomalies",
    "genetic_associations",
    "differential_diagnosis",
    "red_flags",
    "follow_up",
]

TEXT_FIELDS = ["definition", "prognosis", "delivery_recommendations", "postnatal_management", "epidemiology", "embryology"]


def translate_text(text: str) -> str:
    if not text:
        return text
    out = text
    for pattern, repl in GLOSSARY:
        out = re.sub(pattern, repl, out, flags=re.IGNORECASE)
    return out


def translate_list(items: list[str]) -> list[str]:
    return [translate_text(x) for x in items if x]


def main() -> None:
    titles = json.loads((KNOWLEDGE / "ru-titles.json").read_text(encoding="utf-8"))

    for fp in sorted(KNOWLEDGE.glob("*.json")):
        if fp.name in ("manifest.json", "ru-titles.json", "README.source.json"):
            continue
        data = json.loads(fp.read_text(encoding="utf-8"))
        for entry in data["entries"]:
            en = entry["nameEn"]
            entry["name"] = titles.get(en, en)
            for field in TEXT_FIELDS:
                val = entry.get(field)
                if isinstance(val, str) and val:
                    entry[field] = translate_text(val)
            for field in LIST_FIELDS:
                val = entry.get(field)
                if isinstance(val, list) and val:
                    entry[field] = translate_list(val)
        fp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✓ {fp.name}")


if __name__ == "__main__":
    main()
