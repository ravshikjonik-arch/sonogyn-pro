#!/usr/bin/env python3
"""Импорт учебного слоя Shaaban Gynecology 4ed (Desktop/sonogyn-book) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-book")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/shaaban-gyn"
DATA_OUT = ROOT / "packages/gynecology-imaging-atlas/data/atlas.ru.json"

SECTION_RU = {
    "1-techniques": "Методы визуализации",
    "2-uterus": "Матка",
    "3-cervix": "Шейка матки",
    "4-vagina-vulva": "Влагалище и vulva",
    "5-ovary": "Яичник и придатки",
    "6-tubes": "Маточные трубы",
    "7-pelvic": "Таз (воспаление, DSD, метастазы)",
    "8-pelvic-floor": "Тазовое дно (МРТ)",
}

# Словарь EN→RU (длинные фразы первыми — порядок важен)
PHRASES_RU: list[tuple[str, str]] = [
    (r"\bTransvaginal ultrasound\b", "Трансвагинальное УЗИ"),
    (r"\bTransabdominal ultrasound\b", "Трансабdominalное УЗИ"),
    (r"\bLongitudinal transvaginal ultrasound\b", "Продольное ТВУЗ"),
    (r"\bTransverse transvaginal ultrasound\b", "Поперечное ТВУЗ"),
    (r"\bColor Doppler\b", "ЦДК"),
    (r"\bPower Doppler\b", "Power Doppler"),
    (r"\bKEY FACTS\b", "КЛЮЧЕВЫЕ ПОЛОЖЕНИЯ"),
    (r"\bIMAGING\b", "ВИЗУАЛИЗАЦИЯ"),
    (r"\bTOP DIFFERENTIAL DIAGNOSES\b", "ДИФФЕРЕНЦИАЛЬНАЯ ДИАГНОСТИКА"),
    (r"\bCLINICAL ISSUES\b", "КЛИНИКА"),
    (r"\bDIFFERENTIAL DIAGNOSIS\b", "ДИФФЕРЕНЦИАЛЬНАЯ ДИАГНОСТИКА"),
    (r"\bHemorrhagic Functional Cyst\b", "Геморрагическая функциональная киста"),
    (r"\bMature Cystic Teratoma\b", "Зрелая кистозная тератома (дерmoid)"),
    (r"\bCystic Ovarian Neoplasm\b", "Кистозная опухоль яичника"),
    (r"\bOvarian Abscess\b", "Яичниковый абсcess"),
    (r"\bGround-glass\b", "«матовое стекло»"),
    (r"\bT2 shading\b", "затемнение на T2"),
    (r"\bT2 dark spot sign\b", "признак тёмного участка на T2"),
    (r"\bfluid-fluid level\b", "уровень жидкость–жидкость"),
    (r"\bposterior acoustic enhancement\b", "заднее акустическое усиление"),
    (r"\bring of fire\b", "«огненное кольцо»"),
    (r"\bwhirlpool sign\b", "признак «воронки»"),
    (r"\bsliding sign\b", "sliding sign (симптом «скольжения»)"),
    (r"\bPremenopausal\b", "премenопаузальный возраст"),
    (r"\bPostmenopausal\b", "постmenопауза"),
    (r"\bTVUS\b", "ТВУЗ"),
    (r"\bTAUS\b", "ТАУЗ"),
    (r"\bMR\b", "МРТ"),
    (r"\bMRI\b", "МРТ"),
    (r"\bCT\b", "КТ"),
    (r"\bDWI\b", "DWI"),
    (r"\bFS\b", "подавление жира"),
    (r"\bT1WI\b", "T1"),
    (r"\bT2WI\b", "T2"),
    (r"\bEndometrioma\b", "Эндометриома"),
    (r"\bEndometriosis\b", "Эндометриоз"),
    (r"\bLeiomyoma\b", "Лейомиома"),
    (r"\bAdenomyosis\b", "Аdenomyosis"),
    (r"\bHydrosalpinx\b", "Гидросальпинкс"),
    (r"\bPCOS\b", "СПКЯ"),
    (r"\bOHSS\b", "СГЯ"),
    (r"\bPID\b", "ВЗОМТ"),
    (r"\bSolitary\b", "Одиночное"),
    (r"\bBilateral\b", "Двустороннее"),
    (r"\bUnilocular\b", "Однокамерное"),
    (r"\bMultilocular\b", "Многокамерное"),
    (r"\bSolid\b", "Солидный компонент"),
    (r"\bCystic\b", "Кистозное"),
    (r"\bEnhancement\b", "конtrastное накопление"),
    (r"\bAscites\b", "Асцит"),
    (r"\bDysmenorrhea\b", "Дисменорея"),
    (r"\bDyspareunia\b", "Дисpareunia"),
    (r"\bInfertility\b", "Бесплодие"),
]

TITLE_RU_BY_SLUG: dict[str, str] = {
    "us-technique-anatomy": "Техника УЗИ и анатомия малого таза",
    "ovary-anatomy": "Анатомия яичников",
    "follicular-cyst": "Фолликулярная киста",
    "corpus-luteum": "Жёлтое тело",
    "hemorrhagic-ovarian-cyst": "Геморрагическая киста яичника",
    "ovarian-inclusion-cyst": "Инклюзионная киста яичника",
    "endometrioma": "Эндометриома",
    "endometriosis": "Эндометриоз",
    "mature-cystic-teratoma": "Зрелая кистозная тератома",
    "serous-cystadenoma": "Серозная кистаденома",
    "mucinous-cystadenoma": "Слизистая (муцинозная) кистаденома",
    "serous-carcinoma": "Серозный рак яичника",
    "pcos": "Синдром поликистозных яичников",
    "hydrosalpinx": "Гидросальпинкс",
    "peritoneal-inclusion-cysts": "Перитонеальные инклюзионные кисты",
    "acute-adnexal-torsion": "Острая адnexal торсия",
    "uterine-leiomyoma": "Лейомиома матки",
    "adenomyosis": "Adenomyosis (адenomyosis) матки",
    "endometrial-carcinoma": "Рак эндометрия",
}


WORDS_RU: list[tuple[str, str]] = [
    ("hemorrhagic", "геморрагическое"),
    ("ovarian", "яичника"),
    ("mass", "образование"),
    ("masses", "образования"),
    ("thick", "толстая"),
    ("wall", "стенка"),
    ("capsule", "капсула"),
    ("internal", "внутреннее"),
    ("flow", "кровоток"),
    ("Doppler", "дoppler"),
    ("echoes", "эхосигналы"),
    ("low-level", "низкоуровневые"),
    ("homogeneous", "однородное"),
    ("diffuse", "диффузное"),
    ("sensitive", "чувствительнее"),
    ("specific", "специфичнее"),
    ("differentiating", "дифференциации"),
    ("restricted", "ограниченная"),
    ("diffusion", "диффузия"),
    ("complications", "осложнения"),
    ("neoplasm", "новообразование"),
    ("rupture", "разрыв"),
    ("pregnancy", "беременность"),
    ("involvement", "поражение"),
    ("multiple", "множественное"),
    ("solitary", "одиночное"),
    ("adherent", "спаянные"),
    ("adjacent", "смежными"),
    ("structures", "структурами"),
    ("calcifications", "кальцинаты"),
    ("punctate", "точечные"),
    ("mural", "стеночные"),
    ("linear", "линейные"),
    ("contains", "содержит"),
    ("may", "может"),
    ("with", "с"),
    ("without", "без"),
    ("and", "и"),
    ("or", "или"),
    ("in", "в"),
    ("of", ""),
    ("seen", "отмечается"),
    ("during", "во время"),
    ("fat", "жир"),
    ("suppression", "подавление"),
    ("improved", "улучшенная"),
    ("detection", "выявление"),
    ("characterization", "характеристика"),
    ("anatomy", "анатомия"),
    ("technique", "техника"),
    ("syndrome", "синдром"),
    ("cyst", "киста"),
    ("cysts", "кисты"),
    ("tumor", "опухоль"),
    ("tumors", "опухоли"),
    ("carcinoma", "кarcinoma"),
    ("sarcoma", "сarcoma"),
    ("polyp", "полип"),
    ("polypoid", "полипоидный"),
    ("hyperplasia", "гиперплазия"),
    ("atrophy", "atrophy"),
    ("leiomyoma", "лейомиома"),
    ("adenomyosis", "адenomyosis"),
    ("endometrial", "эндометриальный"),
    ("endometriosis", "эндометриоз"),
    ("endometrioma", "эндометриома"),
    ("teratoma", "тератома"),
    ("cystadenoma", "кистадenoma"),
    ("hydrosalpinx", "гидросальпинкс"),
    ("torsion", "торсия"),
    ("metastases", "метастазы"),
    ("lymphoma", "лимфoma"),
]

CURATED_KEY_FACTS_RU: dict[str, list[str]] = {
    "endometrioma": [
        "Кистозное геморрагическое образование яичника с плотной фиброзной капсулой.",
        "Обычно < 15 см; одиночное или множественное; одно- или многокамерное.",
        "ТВУЗ: однородная низкоуровневая эхоструктура («матовое стекло»); стеночные гиперэхогенные foci.",
        "МРТ: T2 shading — чувствительный признак; T2 dark spot — специфичнее vs другие геморрагические кисты.",
        "Двустороннее поражение в 30–50%.",
    ],
    "us-technique-anatomy": [
        "Структурированный отчёт: матка, эндометрий (толщина, ВМС), аднексы, Douglas (жидкость, sliding sign).",
        "Режимы: B-mode, M-mode, Color/Power Doppler, спектральный анализ.",
    ],
    "ovary-anatomy": [
        "Объём яичника (0,523×L×W×T): репродуктивный возраст ~4–16 см³; постmenопауза ~1,2–5,8 см³.",
    ],
}

CYRILLIC_FIXES = [
    ("гemоррагическ", "геморрагическ"),
    ("каpsula", "каpsula"),
    ("кarcinoma", "кarcinoma"),
    ("сarcoma", "сarcoma"),
    ("atrophy", "atrophy"),
    ("адenomyosis", "адenomyosis"),
    ("кистадenoma", "кистадenoma"),
    ("лимфoma", "лимфoma"),
    ("дoppler", "Doppler"),
    ("конtrastное", "контрастное"),
    ("Transabdominal", "Трансабdominal"),
    ("Дисpareunia", "Дисpareunia"),
]


def translate_medical(text: str) -> str:
    if not text or not text.strip():
        return text
    out = text
    for pat, repl in PHRASES_RU:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    for en, ru in sorted(WORDS_RU, key=lambda x: -len(x[0])):
        out = re.sub(rf"\b{re.escape(en)}\b", ru, out, flags=re.IGNORECASE)
    out = re.sub(r"\bthe\b", "", out, flags=re.IGNORECASE)
    for bad, good in CYRILLIC_FIXES:
        out = out.replace(bad, good)
    out = re.sub(r"\s{2,}", " ", out).strip()
    return out


def title_ru(slug: str, title_en: str) -> str:
    if slug in TITLE_RU_BY_SLUG:
        return TITLE_RU_BY_SLUG[slug]
    translated = translate_medical(title_en)
    if translated and len(translated) > 2:
        return translated[0].upper() + translated[1:] if translated[0].isalpha() else translated
    base = slug.replace("-", " ").replace("mullerian", "Müllerian")
    return base.title()


def parse_key_facts_md(path: Path) -> tuple[list[str], list[dict]]:
    if not path.is_file():
        return [], []
    raw = path.read_text(encoding="utf-8", errors="replace")
    lines = raw.splitlines()
    key_facts: list[str] = []
    ddx: list[dict] = []
    mode = None
    current_dx: dict | None = None
    for line in lines:
        s = line.strip()
        if s.startswith("# "):
            continue
        if s == "## KEY FACTS" or s.upper() == "KEY FACTS":
            mode = "facts"
            continue
        if s == "## DIFFERENTIAL DIAGNOSIS" or "DIFFERENTIAL" in s.upper() and "DIAGNOS" in s.upper():
            mode = "ddx"
            current_dx = None
            continue
        if mode == "facts" and s.startswith("##"):
            mode = None
            continue
        if mode == "facts" and s:
            key_facts.append(translate_medical(s.lstrip("•○- ").strip()))
        if mode == "ddx":
            if s and not s.startswith("•") and not s.startswith("○") and not s.startswith("-"):
                if current_dx:
                    ddx.append(current_dx)
                current_dx = {"diagnosisRu": translate_medical(s), "pointsRu": []}
            elif current_dx and s:
                current_dx["pointsRu"].append(translate_medical(s.lstrip("•○- ").strip()))
    if current_dx:
        ddx.append(current_dx)
    return key_facts, ddx


def extract_key_facts_from_chapter(md_path: Path) -> list[str]:
    if not md_path.is_file():
        return []
    text = md_path.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"KEY FACTS\s*(.*?)(?:TOP DIFFERENTIAL|CLINICAL ISSUES|\Z)", text, re.S | re.I)
    if not m:
        return []
    block = m.group(1)
    facts: list[str] = []
    for line in block.splitlines():
        s = line.strip()
        if not s or s.startswith("(") or len(s) < 4:
            continue
        if re.match(r"^[•○\-]", s) or s.startswith("○"):
            facts.append(translate_medical(s.lstrip("•○- ")))
        elif re.match(r"^[A-Z][A-Z ]+$", s):
            continue
        elif s.endswith(":") or len(s) < 120:
            facts.append(translate_medical(s))
    return facts[:40]


def load_images_csv(book: Path) -> dict[str, list[dict]]:
    csv_path = book / "sonogyn-us-atlas/index.csv"
    by_slug: dict[str, list[dict]] = {}
    if not csv_path.is_file():
        return by_slug
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get("slug", "")
            rel = row.get("file", "")
            cap = translate_medical(row.get("caption", "") or "")
            by_slug.setdefault(slug, []).append(
                {
                    "file": rel,
                    "captionRu": cap,
                    "modality": row.get("modality", "us"),
                    "printPage": row.get("print_page"),
                }
            )
    return by_slug


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
    images_by_slug = load_images_csv(book)
    key_facts_dir = book / "key-facts"

    if not args.skip_copy_images:
        src_atlas = book / "sonogyn-us-atlas"
        if src_atlas.is_dir():
            if PUBLIC_IMG.exists():
                shutil.rmtree(PUBLIC_IMG)
            shutil.copytree(src_atlas, PUBLIC_IMG, ignore=shutil.ignore_patterns(".DS_Store"))
            print(f"Скопировано изображений: {sum(1 for _ in PUBLIC_IMG.rglob('*.jpeg'))}")

    chapters = []
    for ch in chapters_meta:
        slug = ch["slug"]
        sec_num = ch["section"].split("-")[0]
        kf_path = key_facts_dir / f"{sec_num}-{ch['print_start']}-{slug}.md"
        key_facts, ddx = parse_key_facts_md(kf_path)
        if not key_facts:
            md_rel = ch.get("file", "")
            key_facts = extract_key_facts_from_chapter(book / md_rel)
        if slug in CURATED_KEY_FACTS_RU:
            key_facts = CURATED_KEY_FACTS_RU[slug] + [f for f in key_facts if f not in CURATED_KEY_FACTS_RU[slug]][
                :20
            ]

        imgs = []
        for im in images_by_slug.get(slug, []):
            href = f"/clinical-atlas/shaaban-gyn/{im['file']}"
            imgs.append({**im, "href": href})

        chapters.append(
            {
                "slug": slug,
                "titleRu": title_ru(slug, ch["title"]),
                "titleEn": ch["title"],
                "section": ch["section"],
                "sectionRu": SECTION_RU.get(ch["section"], ch["section"]),
                "printStart": ch["print_start"],
                "printEnd": ch["print_end"],
                "keyFactsRu": key_facts,
                "differentialRu": ddx,
                "images": imgs,
            }
        )

    doc = {
        "meta": {
            "bookId": "shaaban-diagnostic-imaging-gynecology-4ed",
            "titleRu": "Диагностическая визуализация в гинекологии (учебный атлас УЗИ/МРТ/КТ)",
            "sourceEn": "Shaaban S. et al. Diagnostic Imaging: Gynecology, 4th ed. (2021)",
            "disclaimerRu": (
                "Учебный материал SonoGyn Pro. Тексты адаптированы на русский язык по ключевым положениям "
                "и подписям к снимкам; не заменяют клиническое заключение и официальные классификации (O-RADS, FIGO)."
            ),
            "imageBase": "/clinical-atlas/shaaban-gyn",
            "chapterCount": len(chapters),
            "usImageCount": sum(len(c["images"]) for c in chapters),
        },
        "sections": [
            {"id": sid, "titleRu": title}
            for sid, title in SECTION_RU.items()
        ],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав)")


if __name__ == "__main__":
    main()
