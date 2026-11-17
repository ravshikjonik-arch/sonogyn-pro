#!/usr/bin/env python3
"""Пересборка локального корпуса неотложки из PDF справочника фельдшера 2025.

Полный текст → packages/medical-knowledge/data/emergency-corpus/ (gitignore).
Запуск из корня monorepo или из пакета:

  python3 packages/medical-knowledge/scripts/extract-emergency-corpus.py \\
    --pdf ~/Downloads/Полный_медицинский_справочник_фельдшера_2025.pdf
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as e:  # pragma: no cover
    raise SystemExit("pip install pypdf") from e

PKG = Path(__file__).resolve().parents[1]
CORPUS = PKG / "data" / "emergency-corpus"
SOURCE = {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001",
    "title": "Полный медицинский справочник фельдшера",
    "shortTitle": "Справочник фельдшера 2025",
    "authors": "Макеев А.В. / под ред. Ю.Ю. Елисеева",
    "organization": None,
    "publisher": "Эксмо",
    "edition": "2025",
    "year": 2025,
    "isbn": "978-5-04-185712-7",
    "doi": None,
    "externalUrl": None,
    "sourceType": "book",
    "language": "ru",
    "reviewStatus": "extracted",
    "version": "1.0.0-corpus",
    "chapter": None,
    "pageStart": None,
    "pageEnd": None,
    "verified": False,
}


def slugify(title: str, page: int) -> str:
    s = title.lower().replace("ё", "е")
    s = re.sub(r"[^a-zа-я0-9]+", "-", s, flags=re.I)
    s = re.sub(r"-+", "-", s).strip("-")[:70]
    return f"emergency-{s}-p{page}"


def uuid_from(s: str) -> str:
    h = hashlib.md5(s.encode()).hexdigest()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def parse_toc(pages: list[str]) -> list[dict]:
    toc_text = "\n".join(pages[5:12])
    raw_lines = [re.sub(r"\s+", " ", ln).strip() for ln in toc_text.splitlines()]
    raw_lines = [ln for ln in raw_lines if ln and not ln.isdigit() and ln.upper() != "СОДЕРЖАНИЕ"]
    page_end_re = re.compile(
        r"^(?P<title>.+?)\s*(?:\.{2,}|(?:\. ){2,}|\u2026+)\s*\.?\s*(?P<page>\d{1,3})$"
    )
    merged: list[str] = []
    buf = ""
    for ln in raw_lines:
        if "Часть" in ln and ln.upper().startswith("ЧАСТЬ"):
            if buf:
                merged.append(buf)
                buf = ""
            merged.append(ln)
            continue
        if page_end_re.match(ln):
            full = (buf + " " + ln).strip() if buf else ln
            merged.append(full)
            buf = ""
        else:
            if re.fullmatch(r"Глава\s+\d+\..*", ln, re.I) or (ln.isupper() and len(ln) > 8):
                if buf:
                    merged.append(buf)
                buf = ln
            else:
                buf = (buf + " " + ln).strip() if buf else ln
    if buf:
        merged.append(buf)

    entries: list[dict] = []
    for ln in merged:
        if re.match(r"^Часть\s+", ln, re.I):
            continue
        m = page_end_re.match(ln)
        if not m:
            continue
        title = re.sub(r"\s+", " ", m.group("title").strip(" .")).replace("Г лава", "Глава")
        page = int(m.group("page"))
        if len(title) < 4:
            continue
        entries.append({"title": title, "pageStart": page})

    dedup: list[dict] = []
    for e in entries:
        if dedup and dedup[-1]["pageStart"] == e["pageStart"] and dedup[-1]["title"][:20] == e["title"][:20]:
            if len(e["title"]) > len(dedup[-1]["title"]):
                dedup[-1] = e
            continue
        dedup.append(e)
    for i, e in enumerate(dedup):
        e["pageEnd"] = dedup[i + 1]["pageStart"] - 1 if i + 1 < len(dedup) else len(pages)
        if e["pageEnd"] < e["pageStart"]:
            e["pageEnd"] = e["pageStart"]
    return dedup


def keep_emergency(e: dict) -> bool:
    t = e["title"]
    p = e["pageStart"]
    low = t.lower()
    if p < 21 or p > 180:
        return False
    skip_kw = [
        "приказ",
        "оснащение машин",
        "должностн",
        "нормативно-правов",
        "ведение документации",
        "поведение фельдшера",
        "по дороге на вызов",
        "нерабочее время",
        "основные функциональные",
        "лабораторн",
    ]
    if any(k in low for k in skip_kw):
        return False
    if sum(ch.isalpha() for ch in t) < 8:
        return False
    if re.match(r"^(и |на |при |во |с |со |к |по |из |от )", low) and len(t) < 40:
        return False
    return bool(t.startswith("Глава") or t.isupper() or t[0].isupper() or "(" in t)


def extract_aliases(title: str) -> list[str]:
    aliases = [title]
    for m in re.finditer(r"\(([^)]+)\)", title):
        aliases.append(m.group(1).strip())
    base = re.sub(r"\s*\([^)]*\)\s*", " ", title).strip()
    if base and base != title:
        aliases.append(base)
    low = title.lower()
    mapping = {
        "инфаркт миокарда": ["инфаркт", "оим", "окс", "инфаркт миокарда", "острый коронарный"],
        "тромбоэмболия легочной": ["тэла", "эмболия легочной"],
        "гипертензивн": ["гипертонический криз", "криз", "гк"],
        "гипогликемическая": ["гипогликемия", "гипогликемическая кома"],
        "гипергликемическая": ["гипергликемия", "диабетическая кома", "дка"],
        "бронхиальная астма": ["астма", "приступ астмы"],
        "анафилактическ": ["анафилаксия", "анафилактический шок"],
        "инфаркт головного": ["инсульт", "онмк", "инфаркт мозга"],
        "острые сосудистые заболевания головного": ["инсульт", "онмк"],
        "отек мозга": ["отёк мозга", "отек мозга"],
        "спонтанный пневмоторакс": ["пневмоторакс"],
        "острая левожелудочковая": ["олжн", "отёк лёгких", "отек легких"],
        "внематочная": ["внематочная", "эктопическая беременность"],
        "черепно-мозговая": ["чмт", "сотрясение"],
        "электрокардиография": ["экг"],
        "острые отравления": ["отравление", "отравления"],
        "угарный газ": ["угарный газ", "со отравление"],
    }
    for k, vals in mapping.items():
        if k in low:
            aliases.extend(vals)
    seen: set[str] = set()
    out: list[str] = []
    for a in aliases:
        key = a.strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(a.strip())
    return out


def split_clinical(text: str) -> dict[str, str]:
    t = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    t = re.sub(r"\n+", "\n", t)
    t = re.sub(r"[ \t]+", " ", t).strip()
    body = t[:8000]
    steps = ""
    for pat in [
        r"Неотложн[аяые]+\s+помощ[ьи][:\.]?\s*(.+)",
        r"Лечение[:\.]?\s*(.+)",
        r"Тактика[:\.]?\s*(.+)",
    ]:
        m = re.search(pat, body, re.I | re.S)
        if m:
            steps = m.group(1)[:3500].strip()
            break
    if not steps:
        steps = body[len(body) // 4 : 3 * len(body) // 4][:3500] if len(body) > 800 else body
    red = body[:2500]
    do_not = (
        "Не задерживать эвакуацию при нестабильности; не оставлять без мониторинга. "
        "Дозировки — по актуальным КР и локальным протоколам."
    )
    esc = "Госпитализация при нестабильной гемодинамике, ДН, нарушении сознания, ОКС/ОНМК/ТЭЛА/острый живот/шок."
    m2 = re.search(r"(транспорт\w*|госпитализ\w*)[^\n]{0,240}", body, re.I)
    if m2:
        esc = m2.group(0)[:600]
    return {"red_flags": red, "steps": steps, "do_not": do_not, "escalation": esc}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--pdf",
        type=Path,
        default=Path.home() / "Downloads" / "Полный_медицинский_справочник_фельдшера_2025.pdf",
    )
    ap.add_argument("--extra-pdf", type=Path, action="append", default=[])
    args = ap.parse_args()
    if not args.pdf.exists():
        raise SystemExit(f"PDF not found: {args.pdf}")

    pages_dir = CORPUS / "pages"
    pdfs_dir = CORPUS / "pdfs"
    pages_dir.mkdir(parents=True, exist_ok=True)
    pdfs_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(args.pdf, pdfs_dir / "feldscher-2025.pdf")
    for extra in args.extra_pdf:
        if extra.exists():
            shutil.copy2(extra, pdfs_dir / extra.name)

    reader = PdfReader(str(args.pdf))
    pages: list[str] = []
    for i, page in enumerate(reader.pages):
        t = (page.extract_text() or "").replace("\u00a0", " ").replace("\xad", "")
        pages.append(t)
        (pages_dir / f"{i + 1:04d}.txt").write_text(t, encoding="utf-8")

    chunks = []
    for i, text in enumerate(pages):
        page = i + 1
        text = text.strip()
        if len(text) < 40:
            continue
        chunks.append(
            {
                "id": f"feldscher-2025-p{page}",
                "sourceId": SOURCE["id"],
                "page": page,
                "title": f"Справочник фельдшера 2025 · стр. {page}",
                "text": text,
                "charCount": len(text),
            }
        )
    (CORPUS / "chunks.jsonl").write_text(
        "\n".join(json.dumps(c, ensure_ascii=False) for c in chunks), encoding="utf-8"
    )

    toc = parse_toc(pages)
    emergency = [e for e in toc if keep_emergency(e)]

    articles = []
    for e in emergency:
        start, end = e["pageStart"], e["pageEnd"]
        joined = "\n".join(
            pages[p - 1] for p in range(start, min(end, len(pages)) + 1) if 1 <= p <= len(pages)
        )
        parts = split_clinical(joined)
        slug = slugify(e["title"], start)
        src = {**SOURCE, "chapter": e["title"], "pageStart": start, "pageEnd": end}
        articles.append(
            {
                "id": uuid_from(f"article:{slug}"),
                "slug": slug,
                "title": e["title"],
                "specialty": "emergency",
                "topicType": "emergency_action",
                "summary": f"«{e['title']}» — стр. {start}–{end}, справочник фельдшера 2025. Справочно; решение — врач.",
                "version": "1.0.0-corpus",
                "aliases": extract_aliases(e["title"]),
                "sections": [
                    {
                        "id": uuid_from(f"{slug}:rf"),
                        "sectionType": "red_flags",
                        "title": "Клиника / на что смотреть",
                        "content": parts["red_flags"],
                        "sortOrder": 0,
                    },
                    {
                        "id": uuid_from(f"{slug}:as"),
                        "sectionType": "action_steps",
                        "title": "Что делать (1-2-3)",
                        "content": parts["steps"],
                        "sortOrder": 1,
                    },
                    {
                        "id": uuid_from(f"{slug}:dn"),
                        "sectionType": "do_not",
                        "title": "Чего не делать",
                        "content": parts["do_not"],
                        "sortOrder": 2,
                    },
                    {
                        "id": uuid_from(f"{slug}:es"),
                        "sectionType": "escalation",
                        "title": "Эскалация / госпитализация",
                        "content": parts["escalation"],
                        "sortOrder": 3,
                    },
                    {
                        "id": uuid_from(f"{slug}:src"),
                        "sectionType": "education",
                        "title": "Источник",
                        "content": f"Макеев/Елисеев, 2025, стр. {start}–{end}. ISBN 978-5-04-185712-7.",
                        "sortOrder": 4,
                    },
                ],
                "sources": [src],
            }
        )

    page_articles = []
    for i, text in enumerate(pages):
        page = i + 1
        if page < 21 or page > 180:
            continue
        t = re.sub(r"(\w)-\n(\w)", r"\1\2", text.strip())
        t = re.sub(r"\s+", " ", t)
        if len(t) < 80:
            continue
        slug = f"emergency-page-{page}"
        src = {**SOURCE, "chapter": f"стр. {page}", "pageStart": page, "pageEnd": page}
        page_articles.append(
            {
                "id": uuid_from(f"page:{page}"),
                "slug": slug,
                "title": f"Справочник фельдшера · стр. {page}",
                "specialty": "emergency",
                "topicType": "emergency_page",
                "summary": f"Полный текст страницы {page} (локальный корпус).",
                "version": "1.0.0-corpus",
                "aliases": [f"стр {page}", f"страница {page}"],
                "sections": [
                    {
                        "id": uuid_from(f"page:{page}:body"),
                        "sectionType": "clinical_context",
                        "title": f"Текст стр. {page}",
                        "content": t[:12000],
                        "sortOrder": 0,
                    },
                    {
                        "id": uuid_from(f"page:{page}:src"),
                        "sectionType": "education",
                        "title": "Источник",
                        "content": f"ISBN 978-5-04-185712-7, стр. {page}.",
                        "sortOrder": 1,
                    },
                ],
                "sources": [src],
            }
        )

    (CORPUS / "toc.json").write_text(json.dumps(toc, ensure_ascii=False, indent=2), encoding="utf-8")
    (CORPUS / "articles.json").write_text(
        json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (CORPUS / "page-articles.json").write_text(
        json.dumps(page_articles, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    index = [
        {
            "title": e["title"],
            "pageStart": e["pageStart"],
            "pageEnd": e["pageEnd"],
            "slug": slugify(e["title"], e["pageStart"]),
        }
        for e in emergency
    ]
    (PKG / "src" / "fixtures" / "emergency-toc-index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    manifest = {
        "source": SOURCE,
        "pageCount": len(pages),
        "tocEntryCount": len(toc),
        "emergencyArticleCount": len(articles),
        "pageArticleCount": len(page_articles),
        "chunkCount": len(chunks),
        "pdfs": [p.name for p in pdfs_dir.glob("*.pdf")],
        "totalCorpusChars": sum(len(p) for p in pages),
        "note": "Локальный полный корпус. Не коммитить / не деплоить публично.",
    }
    (CORPUS / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
