#!/usr/bin/env python3
"""OCR двух сканов неотложки → локальный корпус (gitignore).

Требует: pymupdf + tesseract (rus+eng). Запуск из корня monorepo:

  python3 packages/medical-knowledge/scripts/ocr-emergency-scans.py
  python3 packages/medical-knowledge/scripts/ocr-emergency-scans.py --book skoraya
  python3 packages/medical-knowledge/scripts/ocr-emergency-scans.py --workers 4 --dpi 150

Текст → data/emergency-corpus/ocr/{book}/pages/*.txt + articles JSON.
PNG после страницы удаляются (экономия места). Resume по наличию .txt.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

try:
    import pymupdf
except ImportError as e:  # pragma: no cover
    raise SystemExit("pip install pymupdf") from e

PKG = Path(__file__).resolve().parents[1]
CORPUS = PKG / "data" / "emergency-corpus"
PDFS = CORPUS / "pdfs"
OCR_ROOT = CORPUS / "ocr"

BOOKS = {
    "skoraya": {
        "pdf": "skoraya-smp.pdf",
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002",
        "title": "Скорая медицинская помощь",
        "shortTitle": "Скорая помощь (скан)",
        "authors": None,
        "publisher": None,
        "year": None,
        "isbn": None,
        "sourceType": "book",
        "language": "ru",
        "reviewStatus": "ocr_extracted",
        "version": "1.0.0-ocr",
        "verified": False,
    },
    "neotlozhnaya": {
        "pdf": "neotlozhnaya-terapiya.pdf",
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003",
        "title": "Оказание неотложной помощи в терапии",
        "shortTitle": "Неотложная терапия (скан)",
        "authors": None,
        "publisher": None,
        "year": None,
        "isbn": None,
        "sourceType": "book",
        "language": "ru",
        "reviewStatus": "ocr_extracted",
        "version": "1.0.0-ocr",
        "verified": False,
    },
}


def uuid_from(s: str) -> str:
    h = hashlib.md5(s.encode()).hexdigest()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def ocr_one_page(args: tuple) -> tuple[int, int, str]:
    """(page_1based, char_count, status). Worker entry."""
    pdf_path, page_idx, out_txt, dpi, lang = args
    out = Path(out_txt)
    if out.exists() and out.stat().st_size > 40:
        return page_idx + 1, out.stat().st_size, "skip"

    doc = pymupdf.open(pdf_path)
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=dpi)
    png = out.with_suffix(".png")
    pix.save(str(png))
    doc.close()

    base = str(out.with_suffix(""))
    r = subprocess.run(
        ["tesseract", str(png), base, "-l", lang, "--psm", "6"],
        capture_output=True,
    )
    try:
        png.unlink(missing_ok=True)
    except OSError:
        pass

    if r.returncode != 0 or not out.exists():
        err = (r.stderr or b"").decode("utf-8", "replace")[:200]
        return page_idx + 1, 0, f"fail:{err}"

    text = out.read_text(encoding="utf-8", errors="replace")
    # лёгкая нормализация
    text = text.replace("\u00a0", " ").replace("\xad", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    out.write_text(text + ("\n" if text else ""), encoding="utf-8")
    return page_idx + 1, len(text), "ok"


NOISE_RE = re.compile(
    r"скорая медицинская помощь|стандарты медицинской помощи|оказание неотложной|"
    r"раздел\s*\d+|тема\s*\d+|содержание|оглавление|©",
    re.I,
)
def pick_title(text: str, short: str) -> str:
    for ln in text.splitlines():
        s = ln.strip(" .·•-_®©")
        if len(s) < 8:
            continue
        if NOISE_RE.search(s) and len(s) < 80:
            continue
        if re.fullmatch(r"[\d\s\.]+", s):
            continue
        if sum(c.isalpha() for c in s) < 8:
            continue
        return s[:120]
    return f"{short} · выдержка"


def page_aliases(book_key: str, page: int, title: str) -> list[str]:
    # Без сырых клинических ключей: иначе OCR перебивает curated-гайды по exact alias.
    out = [title, f"{book_key} стр {page}", f"страница {page} {book_key}"]
    seen: set[str] = set()
    res: list[str] = []
    for a in out:
        key = a.lower()
        if key and key not in seen:
            seen.add(key)
            res.append(a)
    return res


def build_articles(book_key: str, pages_dir: Path, source: dict) -> list[dict]:
    articles = []
    files = sorted(pages_dir.glob("*.txt"))
    for f in files:
        page = int(f.stem)
        text = f.read_text(encoding="utf-8", errors="replace").strip()
        if len(text) < 80:
            continue
        alpha = [c for c in text if c.isalpha()]
        cyr = sum(1 for c in alpha if "а" <= c.lower() <= "я" or c.lower() == "ё")
        ratio = (cyr / len(alpha)) if alpha else 0.0
        if ratio < 0.25 and len(text) < 400:
            continue

        slug = f"emergency-ocr-{book_key}-p{page}"
        src = {
            **{k: source[k] for k in (
                "id", "title", "shortTitle", "authors", "publisher", "year",
                "isbn", "sourceType", "language", "reviewStatus", "version", "verified",
            )},
            "organization": None,
            "edition": None,
            "doi": None,
            "externalUrl": None,
            "chapter": f"стр. {page}",
            "pageStart": page,
            "pageEnd": page,
        }
        title = pick_title(text, source["shortTitle"])
        articles.append(
            {
                "id": uuid_from(f"ocr:{book_key}:{page}"),
                "slug": slug,
                "title": title,
                "specialty": "emergency",
                "topicType": "emergency_ocr_page",
                "summary": (
                    f"OCR «{source['title']}», стр. {page}. "
                    "Справочно; решение — врач. Не полный текст книги."
                ),
                "version": "1.0.0-ocr",
                "aliases": page_aliases(book_key, page, title),
                "sections": [
                    {
                        "id": uuid_from(f"ocr:{book_key}:{page}:body"),
                        "sectionType": "clinical_context",
                        "title": f"Текст (OCR) стр. {page}",
                        "content": text[:12000],
                        "sortOrder": 0,
                    },
                    {
                        "id": uuid_from(f"ocr:{book_key}:{page}:src"),
                        "sectionType": "education",
                        "title": "Источник",
                        "content": (
                            f"{source['title']}, стр. {page} (локальный OCR). "
                            "Не воспроизводить целиком; только клиническая выжимка."
                        ),
                        "sortOrder": 1,
                    },
                ],
                "sources": [src],
            }
        )
    return articles


def run_book(book_key: str, workers: int, dpi: int, lang: str, limit: int | None) -> dict:
    meta = BOOKS[book_key]
    pdf = PDFS / meta["pdf"]
    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")

    out_dir = OCR_ROOT / book_key
    pages_dir = out_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf)
    n = doc.page_count
    doc.close()
    if limit is not None:
        n = min(n, limit)

    jobs = []
    for i in range(n):
        out_txt = pages_dir / f"{i + 1:04d}.txt"
        jobs.append((str(pdf), i, str(out_txt), dpi, lang))

    ok = skip = fail = 0
    chars = 0
    print(f"[{book_key}] pages={n} workers={workers} dpi={dpi}", flush=True)

    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(ocr_one_page, j): j[1] for j in jobs}
        done = 0
        for fut in as_completed(futs):
            page, ch, status = fut.result()
            done += 1
            if status == "ok":
                ok += 1
                chars += ch
            elif status == "skip":
                skip += 1
                chars += ch
            else:
                fail += 1
                print(f"  FAIL p{page}: {status}", flush=True)
            if done % 25 == 0 or done == n:
                print(f"  progress {done}/{n} ok={ok} skip={skip} fail={fail}", flush=True)

    articles = build_articles(book_key, pages_dir, meta)
    arts_path = out_dir / "page-articles.json"
    arts_path.write_text(json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8")

    book_manifest = {
        "book": book_key,
        "pdf": meta["pdf"],
        "pageCount": n,
        "ocrOkOrSkip": ok + skip,
        "ocrFail": fail,
        "articleCount": len(articles),
        "totalChars": chars,
        "dpi": dpi,
        "lang": lang,
        "note": "Локальный OCR. Не коммитить полный текст / не деплоить публично.",
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(book_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(book_manifest, ensure_ascii=False, indent=2), flush=True)
    return book_manifest


def update_root_manifest(results: list[dict]) -> None:
    root = CORPUS / "manifest.json"
    data = {}
    if root.exists():
        data = json.loads(root.read_text(encoding="utf-8"))
    data["ocrBooks"] = results
    data["ocrArticleCount"] = sum(r.get("articleCount", 0) for r in results)
    data["note"] = (
        "Локальный полный корпус + OCR сканов. Не коммитить в git / не деплоить публично."
    )
    root.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", choices=["skoraya", "neotlozhnaya", "all"], default="all")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--lang", default="rus+eng")
    ap.add_argument("--limit", type=int, default=None, help="Только первые N страниц (smoke)")
    args = ap.parse_args()

    keys = list(BOOKS) if args.book == "all" else [args.book]
    results = []
    for k in keys:
        results.append(run_book(k, args.workers, args.dpi, args.lang, args.limit))
    update_root_manifest(results)
    print("DONE", file=sys.stderr)


if __name__ == "__main__":
    main()
