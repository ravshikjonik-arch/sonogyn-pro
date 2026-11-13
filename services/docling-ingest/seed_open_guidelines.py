#!/usr/bin/env python3
"""Seed open-licence guidelines into Supabase medical vault as review_required.

Reads Docling JSON from /tmp/sonogyn-poc (or --docs-dir), converts to chunks,
upserts sources + replaces chunks. Does NOT publish and does NOT set rag_allowed.

Requires apps/web/.env.local:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage:
  python3 seed_open_guidelines.py --dry-run
  python3 seed_open_guidelines.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import requests

from docling_json_to_chunks import chunks_from_docling

ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / "apps/web/.env.local"
DEFAULT_DOCLING = Path("/tmp/sonogyn-poc/out/docling")

# Stable IDs — idempotent re-runs.
CATALOG = [
    {
        "id": "b1111111-1111-4111-8111-111111111101",
        "stem": "d1_rae_nodular_goiter_ru",
        "title": "КР РАЭ: узловой зоб (открытый PDF)",
        "organization": "РАЭ / endocrincentr.ru",
        "year": 2005,
        "language": "ru",
        "source_type": "guideline",
        "external_url": "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/zob.pdf",
        "copyright_status": "public_guideline_site",
        "license_notes": "Публичная КР на сайте РАЭ. Docling POC. Перед publish: проверить актуальность редакции.",
        "quotation_allowed": True,
        "rag_allowed": False,
        "docling_file": "d1_rae_nodular_goiter_ru.json",
    },
    {
        "id": "b2222222-2222-4222-8222-222222222202",
        "stem": "d2_who_anc_2017_ru_table1",
        "title": "ВОЗ: дородовая помощь 2017 (табл. 1, RU, стр. 13–22)",
        "organization": "ВОЗ",
        "year": 2017,
        "language": "ru",
        "source_type": "guideline",
        "external_url": "https://iris.who.int/bitstream/handle/10665/255150/9789244549919-rus.pdf?sequence=1",
        "copyright_status": "cc_by_nc_sa_3_0_igo",
        "license_notes": "CC BY-NC-SA 3.0 IGO — NON-COMMERCIAL. Не включать rag_allowed/quotation в коммерческий продукт без юридической проверки. Сейчас только review_required.",
        "quotation_allowed": False,
        "rag_allowed": False,
        "docling_file": "d2_who_anc_2017_ru_table1_p13-22.json",
    },
    {
        "id": "b3333333-3333-4333-8333-333333333303",
        "stem": "d3_eta2023_thyroid_nodules_en",
        "title": "ETA 2023: Thyroid Nodules (EU-TIRADS)",
        "organization": "European Thyroid Association",
        "year": 2023,
        "language": "en",
        "source_type": "guideline",
        "external_url": "https://findresearcher.sdu.dk/ws/files/244460842/etj_ETJ_23_0067.pdf",
        "copyright_status": "cc_by_4_0",
        "license_notes": "CC BY 4.0. Docling: строки EU-TIRADS 1/2 в таблице 3 могут быть слиты; пороги из рисунка-алгоритма стр.4 могут отсутствовать — проверить при ревью.",
        "quotation_allowed": True,
        "rag_allowed": False,
        "docling_file": "d3_eta2023_thyroid_nodules_en.json",
    },
    {
        "id": "b5555555-5555-4555-8555-555555555505",
        "stem": "d5_order_557n_text_ru",
        "title": "Приказ МЗ РФ № 557н (текстовый PDF) — правила УЗИ",
        "organization": "МЗ РФ",
        "year": 2020,
        "language": "ru",
        "source_type": "protocol",
        "external_url": "https://www.medicina.ru/upload/vote/51c/y3igpdo7lnzym31234fth48hfy3xvmeu/Prikaz-Minzdrava-Rossii-ot-08_06_2020-N-557n-Pravila-provedeniya-ultrazvukovykh-issledovaniy.pdf",
        "copyright_status": "official_npa",
        "license_notes": "Официальный НПА (не объект АП, ст. 1259 ГК РФ). Текстовая версия; скан OCR (D4) намеренно не загружен из-за подмены кириллицы.",
        "quotation_allowed": True,
        "rag_allowed": False,
        "docling_file": "d5_order_557n_text_ru.json",
    },
]


def load_env() -> tuple[str, str]:
    vals: dict[str, str] = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=(.*)$", line.strip())
        if m:
            vals[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    url, key = vals.get("NEXT_PUBLIC_SUPABASE_URL", ""), vals.get("SUPABASE_SERVICE_ROLE_KEY", "")
    print(f"NEXT_PUBLIC_SUPABASE_URL: {'найдено' if url else 'отсутствует'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'найдено' if key else 'отсутствует'}")
    if not url or not key:
        sys.exit("Нужны переменные в apps/web/.env.local")
    return url.rstrip("/"), key


class Vault:
    def __init__(self, url: str, key: str):
        self.url = url
        self.h = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def upsert_source(self, row: dict) -> None:
        r = requests.post(
            f"{self.url}/rest/v1/sources",
            headers={**self.h, "Prefer": "resolution=merge-duplicates,return=representation"},
            json=row,
            timeout=60,
        )
        if r.status_code >= 300:
            sys.exit(f"sources upsert {row['id']}: HTTP {r.status_code} {r.text[:300]}")

    def replace_chunks(self, source_id: str, chunks: list[dict]) -> int:
        r = requests.delete(
            f"{self.url}/rest/v1/source_chunks",
            headers=self.h,
            params={"source_id": f"eq.{source_id}"},
            timeout=60,
        )
        if r.status_code >= 300:
            sys.exit(f"chunks delete {source_id}: HTTP {r.status_code} {r.text[:300]}")
        if not chunks:
            return 0
        # batch insert
        batch = 80
        total = 0
        for i in range(0, len(chunks), batch):
            part = chunks[i : i + batch]
            rows = [
                {
                    "source_id": source_id,
                    "section_title": c.get("section_title"),
                    "page_start": c.get("page_start"),
                    "page_end": c.get("page_end"),
                    "chunk_index": c["chunk_index"],
                    "content": c["content"],
                    "sanitized_content": c["content"],
                    "content_hash": c["content_hash"],
                    "token_count": c["token_count"],
                    "review_status": "review_required",
                }
                for c in part
            ]
            r = requests.post(f"{self.url}/rest/v1/source_chunks", headers=self.h, json=rows, timeout=120)
            if r.status_code >= 300:
                sys.exit(f"chunks insert {source_id} @{i}: HTTP {r.status_code} {r.text[:400]}")
            total += len(rows)
        return total


def build_payload(entry: dict, docs_dir: Path) -> tuple[dict, list[dict]]:
    path = docs_dir / entry["docling_file"]
    if not path.is_file():
        sys.exit(f"Нет файла Docling: {path}")
    doc = json.loads(path.read_text(encoding="utf-8"))
    chunks = chunks_from_docling(doc)
    source = {
        "id": entry["id"],
        "title": entry["title"],
        "organization": entry["organization"],
        "year": entry["year"],
        "source_type": entry["source_type"],
        "language": entry["language"],
        "external_url": entry["external_url"],
        "copyright_status": entry["copyright_status"],
        "license_notes": entry["license_notes"],
        "quotation_allowed": entry["quotation_allowed"],
        "rag_allowed": False,
        "review_status": "review_required",
        "version": "1.0.0",
    }
    return source, chunks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docs-dir", type=Path, default=DEFAULT_DOCLING)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if not args.dry_run and not args.apply:
        print("Укажите --dry-run или --apply")
        return 2

    prepared = []
    for entry in CATALOG:
        source, chunks = build_payload(entry, args.docs_dir)
        prepared.append((entry, source, chunks))
        print(f"{entry['stem']}: {len(chunks)} чанков · license={entry['copyright_status']}")

    if args.dry_run:
        print("dry-run OK — БД не менялась")
        return 0

    url, key = load_env()
    vault = Vault(url, key)
    for entry, source, chunks in prepared:
        vault.upsert_source(source)
        n = vault.replace_chunks(source["id"], chunks)
        print(f"  → записано {n} чанков · status=review_required · rag_allowed=false")
    print("Готово. Откройте /admin/source-studio → проверьте → Publish.")
    print("ВОЗ (NC): не публиковать в RAG без юр. проверки.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
