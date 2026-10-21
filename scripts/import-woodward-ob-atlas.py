#!/usr/bin/env python3
"""Импорт учебного слоя Woodward Obstetrics 4ed (Desktop/sonogyn-obstetrics) → SonoGyn Pro."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path("/Users/yakrav7700/Desktop/sonogyn-obstetrics")
PUBLIC_IMG = ROOT / "apps/web/public/clinical-atlas/woodward-ob"
DATA_OUT = ROOT / "packages/obstetrics-imaging-atlas/data/atlas.ru.json"

SECTION_RU = {
    "1-first-trimester": "I триместр",
    "2-brain": "Мозг плода",
    "3-spine": "Позвоночник плода",
    "4-face-neck": "Лицо и шея плода",
    "5-chest": "Грудная клетка плода",
    "6-heart": "Сердце плода",
    "7-abdominal-wall": "Передняя брюшная стенка и ЖКТ",
    "8-genitourinary": "Мочеполовая система плода",
    "9-musculoskeletal": "Опорно-двигательная система плода",
    "10-placenta-membranes": "Плацента, оболочки и пуповина",
    "11-multiple-gestations": "Многоплодная беременность",
    "12-aneuploidy": "Анеплoidия и маркеры УЗИ-скрининга",
    "13-syndromes": "Синдромы и ассоциации",
    "14-infection": "Инфекции",
    "15-fluid-growth": "Околоплодные воды, рост и Doppler",
    "16-maternal": "Состояния матери при беременности",
}

PHRASES_RU: list[tuple[str, str]] = [
    (r"\bTransvaginal ultrasound\b", "Трансвагинальное УЗИ (ТВУЗ)"),
    (r"\bTVUS\b", "ТВУЗ"),
    (r"\bTransabdominal ultrasound\b", "Трансabdominalное УЗИ"),
    (r"\bColor Doppler\b", "ЦДК"),
    (r"\bPower Doppler\b", "Power Doppler"),
    (r"\bKEY FACTS\b", "КЛЮЧЕВЫЕ ПОЛОЖЕНИЯ"),
    (r"\bIMAGING\b", "ВИЗУАЛИЗАЦИЯ"),
    (r"\bTOP DIFFERENTIAL DIAGNOSES\b", "ДИФФЕРЕНЦИАЛЬНАЯ ДИАГНОСТИКА"),
    (r"\bDIFFERENTIAL DIAGNOSIS\b", "ДИФФЕРЕНЦИАЛЬНАЯ ДИАГНОСТИКА"),
    (r"\bintradecidual sac sign\b", "признак внутридекidualного мешка (IDSS)"),
    (r"\bdouble decidual sac sign\b", "признак двойного декidualного мешка"),
    (r"\bintrauterine pregnancy\b", "внутриматочная беременность (ВМБ)"),
    (r"\bIUP\b", "ВМБ"),
    (r"\bectopic pregnancy\b", "внематочная беременность"),
    (r"\bEctopic\b", "Внематочная"),
    (r"\bgestational sac\b", "плодное яйцо (gestational sac)"),
    (r"\byolk sac\b", "желточный мешок"),
    (r"\bfetal pole\b", "эмбрион (fetal pole)"),
    (r"\bcrown-rump length\b", "копчико-теменной размер (КТР)"),
    (r"\bCRL\b", "КТР"),
    (r"\bnuchal translucency\b", "толщина воротникового пространства (ТВП)"),
    (r"\bNT\b", "ТВП"),
    (r"\bductus venosus\b", "венозный проток"),
    (r"\bumbilical artery\b", "пупочная артерия"),
    (r"\bmiddle cerebral artery\b", "средняя мозговая артерия (СМА)"),
    (r"\bMCA\b", "СМА"),
    (r"\buterine artery\b", "маточная артерия"),
    (r"\bUtA\b", "маточная артерия (UtA)"),
    (r"\bplacenta previa\b", "predлежание placentы"),
    (r"\bPlacenta accreta\b", "Приращение placentы (accreta spectrum)"),
    (r"\bTwin-to-twin transfusion\b", "синдром трансфузии близнецов (ТТТС)"),
    (r"\bTTTS\b", "ТТТС"),
    (r"\bchorionicity\b", "хорионность"),
    (r"\bamnionicity\b", "амнионность"),
    (r"\bfetal growth restriction\b", "задержка роста плода (ЗРП)"),
    (r"\bFGR\b", "ЗРП"),
    (r"\bIUGR\b", "ЗРП"),
    (r"\bOligohydramnios\b", "Олигогидramnios"),
    (r"\bPolyhydramnios\b", "Многоводие"),
    (r"\bHydatidiform mole\b", "Пузырный занос"),
    (r"\bComplete hydatidiform mole\b", "Полный пузырный занос"),
    (r"\bMR\b", "МРТ"),
    (r"\bMRI\b", "МРТ"),
    (r"\bCT\b", "КТ"),
]

TITLE_RU_BY_SLUG: dict[str, str] = {
    "embryology-and-anatomy-of-the-first-trimester": "Эмбриология и анатомия I триместра",
    "approach-to-the-first-trimester": "Подход к сканированию I триместра",
    "failed-first-trimester-pregnancy": "Неразвивающаяся беременность I триместра",
    "perigestational-hemorrhage": "Перигестационное кровотечение",
    "chorionic-bump": "Chorionic bump",
    "complete-hydatidiform-mole": "Полный пузырный занос",
    "tubal-ectopic": "Трубная внематочная беременность",
    "interstitial-ectopic": "Интерстициальная внематочная беременность",
    "cesarean-section-scar-pregnancy": "Беременность в рубце кесareva сечения",
    "cervical-ectopic": "Шейечная внемatочная беременность",
    "ovarian-ectopic": "Яичниковая внемatочная беременность",
    "heterotopic-pregnancy": "Гетеротопическая беременность",
    "abdominal-ectopic": "Брюшинная внемatочная беременность",
    "abnormal-gestational-sac-and-contents": "Аномальное плодное яйцо и содержимое",
}

WORDS_RU: list[tuple[str, str]] = [
    ("fetal", "плода"),
    ("fetus", "плод"),
    ("embryo", "эмбрион"),
    ("uterine", "маточный"),
    ("cavity", "полость"),
    ("decidual", "декidual"),
    ("decidua", "декidua"),
    ("chorionic", "хорион"),
    ("amniotic", "амниотический"),
    ("fluid", "жидкость"),
    ("collection", "скопление"),
    ("hemorrhage", "кровотечение"),
    ("pregnancy", "беременность"),
    ("gestational", "gestational"),
    ("sac", "мешок"),
    ("sign", "признак"),
    ("shows", "на снимке"),
    ("probable", "вероятная"),
    ("intrauterine", "внутримatочная"),
    ("extrauterine", "внемatочная"),
    ("ectopic", "внемatочная"),
    ("placenta", "placenta"),
    ("umbilical", "пупочный"),
    ("cord", "пуповина"),
    ("brain", "мозг"),
    ("heart", "сердце"),
    ("spine", "позвоночник"),
    ("syndrome", "синдrome"),
    ("anomaly", "аномалия"),
    ("anomalies", "аномалии"),
    ("mass", "образование"),
    ("cyst", "киста"),
    ("hydrops", "водянка"),
    ("oligohydramnios", "олigogidramnios"),
    ("polyhydramnios", "многоводие"),
    ("growth", "рост"),
    ("restriction", "задержка"),
    ("Doppler", "Doppler"),
    ("ultrasound", "УЗИ"),
    ("with", "с"),
    ("without", "без"),
    ("and", "и"),
    ("or", "или"),
    ("the", ""),
    ("may", "может"),
    ("seen", "отмечается"),
]

CURATED_KEY_FACTS_RU: dict[str, list[str]] = {
    "approach-to-the-first-trimester": [
        "Структурированный протокол I триместра: подтверждение ВМБ, КТР, сердцебиение, число плодов, хорионность/амнионность.",
        "Оценка анатомии: череп, конечности, желточный мешок, плодное яйцо, придатки матери.",
        "Скрининг: ТВП, носовая кость, ductus venosus, tricuspid regurgitation — по локальным протоколам.",
    ],
    "tubal-ectopic": [
        "Внемatочная беременность чаще в маточной трубе; ТВУЗ — основной метод.",
        "Вне матки: adnexal mass с «кольцом» gestational sac, отсутствие внутриuterine ВМБ.",
        "Критично: свободная жидкость в Douglas, гемoperitoneum — признак разрыва.",
    ],
    "complete-hydatidiform-mole": [
        "Полный пузырный занос: «снежная буря» / множественные мелкие кисты в матке на ранних сроках.",
        "Отсутствие эмбриона/плода; повышенный риск gestational trophoblastic disease.",
    ],
}

CYRILLIC_FIXES = [
    ("внемatочная", "внемatочная"),
    ("внутримatочная", "внутримatочная"),
    ("predлежание", "predлежание"),
    ("кesareva", "кесareva"),
    ("олigogidramnios", "олigogidramnios"),
    ("синdrome", "синdrome"),
    ("Анеuploidy", "Анеuploidy"),
    ("допpler", "Doppler"),
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
    return slug.replace("-", " ").title()


def key_facts_md_path(key_facts_dir: Path, ch: dict) -> Path:
    sec_num = ch["section"].split("-")[0]
    return key_facts_dir / f"{sec_num}-{ch['print_start']:04d}-{ch['slug']}.md"


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
        if s == "## DIFFERENTIAL DIAGNOSIS" or ("DIFFERENTIAL" in s.upper() and "DIAGNOS" in s.upper()):
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


def extract_key_facts_from_chapter(book: Path, ch: dict) -> list[str]:
    md_rel = ch.get("file", "")
    md_path = book / md_rel if md_rel else None
    if not md_path or not md_path.is_file():
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

    section_order: list[str] = []
    for ch in chapters_meta:
        if ch["section"] not in section_order:
            section_order.append(ch["section"])

    if not args.skip_copy_images:
        src_atlas = book / "sonogyn-us-atlas"
        if src_atlas.is_dir():
            if PUBLIC_IMG.exists():
                shutil.rmtree(PUBLIC_IMG)
            shutil.copytree(src_atlas, PUBLIC_IMG, ignore=shutil.ignore_patterns(".DS_Store", "index.csv"))
            print(f"Скопировано JPEG: {sum(1 for _ in PUBLIC_IMG.rglob('*.jpeg'))}")

    chapters = []
    for ch in chapters_meta:
        slug = ch["slug"]
        kf_path = key_facts_md_path(key_facts_dir, ch)
        key_facts, ddx = parse_key_facts_md(kf_path)
        if not key_facts:
            key_facts = extract_key_facts_from_chapter(book, ch)
        if slug in CURATED_KEY_FACTS_RU:
            key_facts = CURATED_KEY_FACTS_RU[slug] + [f for f in key_facts if f not in CURATED_KEY_FACTS_RU[slug]][
                :20
            ]

        imgs = []
        for im in images_by_slug.get(slug, []):
            href = f"/clinical-atlas/woodward-ob/{im['file']}"
            imgs.append({**im, "href": href})

        chapters.append(
            {
                "slug": slug,
                "titleRu": title_ru(slug, ch["title"]),
                "titleEn": ch["title"],
                "section": ch["section"],
                "sectionRu": SECTION_RU.get(ch["section"], ch.get("section_name", ch["section"])),
                "printStart": ch["print_start"],
                "printEnd": ch["print_end"],
                "keyFactsRu": key_facts,
                "differentialRu": ddx,
                "images": imgs,
            }
        )

    doc = {
        "meta": {
            "bookId": "woodward-diagnostic-imaging-obstetrics-4ed",
            "titleRu": "Диагностическая визуализация в акушерстве (учебный атлас УЗИ/МРТ)",
            "sourceEn": "Woodward P. et al. Diagnostic Imaging: Obstetrics, 4th ed. (2021)",
            "disclaimerRu": (
                "Учебный материал SonoGyn Pro. Тексты адаптированы на русский язык по ключевым положениям "
                "и подписям к снимкам; не заменяют клиническое заключение, протокол скрининга и официальные "
                "рекомендации (ISUOG, FIGO, локальные КР)."
            ),
            "imageBase": "/clinical-atlas/woodward-ob",
            "chapterCount": len(chapters),
            "usImageCount": sum(len(c["images"]) for c in chapters),
        },
        "sections": [{"id": sid, "titleRu": SECTION_RU.get(sid, sid)} for sid in section_order],
        "chapters": chapters,
    }

    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Записано: {DATA_OUT} ({len(chapters)} глав, {doc['meta']['usImageCount']} УЗИ)")


if __name__ == "__main__":
    main()
