#!/usr/bin/env python3
"""REST seed pack28 dm2-290 via curl --resolve (local DNS sinkhole)."""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[3]
OPEN_TEXT = ROOT / "services/docling-ingest/open-text"
MAX_CHUNK = 1800
MAX_TEXT = 200_000
FORCED_IP = "104.18.38.10"

env_path = ROOT / "apps/web/.env.local"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

URL = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
HOST = URL.replace("https://", "").replace("http://", "").split("/")[0]

PACK = [
    (
        "КР МЗ РФ: сахарный диабет 2 типа у взрослых, 2022 (ID 290_2)",
        "РАЭ / МЗ РФ",
        2022,
        "https://apicr.minzdrav.gov.ru/api.ashx?id=290_2&op=GetClinrecPdf",
        "mz_dm2_290_v2.txt",
        "official_kr_mz_rf",
        "Официальная КР рубрикатора МЗ РФ; актуальная версия (заменяет 290_1 / 2019). AG-adjacent refresh.",
        "guideline",
    ),
]


def sanitize(text: str) -> str:
    t = text.replace("\x00", "").replace("\r\n", "\n")
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def split_oversized(content: str, section):
    parts = []
    rest = content.strip()
    while len(rest) > MAX_CHUNK:
        cut = rest.rfind("\n", 0, MAX_CHUNK)
        if cut < MAX_CHUNK * 0.4:
            cut = rest.rfind(" ", 0, MAX_CHUNK)
        if cut < MAX_CHUNK * 0.4:
            cut = MAX_CHUNK
        parts.append({"sectionTitle": section, "content": rest[:cut].strip()})
        rest = rest[cut:].strip()
    if rest:
        parts.append({"sectionTitle": section, "content": rest})
    return parts


def chunk_plain_text(raw: str):
    normalized = raw.replace("\r\n", "\n").strip()
    if not normalized:
        return []
    blocks = [b.strip() for b in normalized.split("\n\n") if b.strip()]
    out = []
    buf = ""
    section = None

    def flush():
        nonlocal buf
        content = buf.strip()
        if not content:
            return
        for piece in split_oversized(content, section):
            out.append(
                {
                    "chunkIndex": len(out),
                    "sectionTitle": piece["sectionTitle"],
                    "content": piece["content"],
                }
            )
        buf = ""

    for block in blocks:
        if len(buf) + len(block) + 2 > MAX_CHUNK:
            flush()
        buf = f"{buf}\n\n{block}" if buf else block
    flush()
    return out


def rest(path: str, method: str = "GET", body=None, prefer: str = "return=representation"):
    import time

    endpoint = f"{URL}/rest/v1/{path}"
    last_err = None
    for attempt in range(5):
        cmd = [
            "curl",
            "-sS",
            "--max-time",
            "120",
            "--resolve",
            f"{HOST}:443:{FORCED_IP}",
            "-X",
            method,
            endpoint,
            "-H",
            f"apikey: {KEY}",
            "-H",
            f"Authorization: Bearer {KEY}",
            "-H",
            "Content-Type: application/json",
            "-H",
            f"Prefer: {prefer}",
            "-w",
            "\n__HTTP__%{http_code}",
        ]
        tmp = None
        if body is not None:
            tmp = tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json")
            json.dump(body, tmp, ensure_ascii=False)
            tmp.close()
            cmd.extend(["--data-binary", f"@{tmp.name}"])
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True)
        finally:
            if tmp is not None:
                Path(tmp.name).unlink(missing_ok=True)
        if proc.returncode != 0:
            last_err = RuntimeError(f"curl failed: {proc.stderr.strip() or proc.stdout[:300]}")
            time.sleep(2**attempt)
            continue
        out = proc.stdout
        if "__HTTP__" not in out:
            last_err = RuntimeError(f"bad curl output: {out[:300]}")
            time.sleep(2**attempt)
            continue
        body_text, code = out.rsplit("__HTTP__", 1)
        code = code.strip()
        if not code.startswith("2"):
            last_err = RuntimeError(f"{method} {path} {code}: {body_text[:400]}")
            time.sleep(2**attempt)
            continue
        body_text = body_text.strip()
        return json.loads(body_text) if body_text else None
    raise last_err or RuntimeError("rest failed")


def publish_source(source_id: str, version: str = "1.0.0"):
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    try:
        rest(
            "medical_reviews",
            method="POST",
            body={
                "entity_type": "source",
                "entity_id": source_id,
                "status": "approved",
                "notes": "B2 seed pack28 dm2-290: open Minzdrav KR / NPA",
                "reviewed_at": now,
                "source_version": version,
            },
            prefer="return=minimal",
        )
    except RuntimeError as e:
        msg = str(e).lower()
        if "duplicate" not in msg and "unique" not in msg and "409" not in msg:
            raise
    rest(
        f"sources?id=eq.{source_id}",
        method="PATCH",
        body={
            "review_status": "published",
            "rag_allowed": True,
            "quotation_allowed": True,
            "published_at": now,
        },
        prefer="return=minimal",
    )
    rest(
        f"source_chunks?source_id=eq.{source_id}",
        method="PATCH",
        body={"review_status": "published"},
        prefer="return=minimal",
    )
    print("  published", source_id)


def main():
    print("NEXT_PUBLIC_SUPABASE_URL:", "найдено" if URL else "отсутствует")
    print("SUPABASE_SERVICE_ROLE_KEY:", "найдено" if KEY else "отсутствует")
    if not URL or not KEY:
        raise SystemExit(1)

    for title, org, year, external_url, local_text, copyright_status, license_notes, source_type in PACK:
        print("\n—", title)
        path = OPEN_TEXT / local_text
        if not path.exists():
            print("  missing local", local_text)
            continue
        text = sanitize(path.read_text(encoding="utf-8"))[:MAX_TEXT]
        chunks = chunk_plain_text(text)
        expected = len(chunks)

        def insert_chunks(source_id: str):
            rows = [
                {
                    "source_id": source_id,
                    "section_title": c["sectionTitle"],
                    "chunk_index": c["chunkIndex"],
                    "content": c["content"],
                    "sanitized_content": c["content"],
                    "content_hash": hashlib.sha256(c["content"].encode("utf-8")).hexdigest(),
                    "token_count": (len(c["content"]) + 3) // 4,
                    "review_status": "review_required",
                }
                for c in chunks
            ]
            for i in range(0, len(rows), 50):
                rest("source_chunks", method="POST", body=rows[i : i + 50], prefer="return=minimal")
            print("  inserted", source_id, "chunks", len(rows))

        existing = rest(
            f"sources?external_url=eq.{quote(external_url, safe='')}&select=id,review_status,rag_allowed"
        )
        if isinstance(existing, list) and existing:
            row = existing[0]
            have = rest(
                f"source_chunks?source_id=eq.{row['id']}&select=id&limit=1000"
            )
            n = len(have) if isinstance(have, list) else 0
            print(
                "  already:",
                row["id"],
                row["review_status"],
                "rag=",
                row["rag_allowed"],
                f"chunks={n}/{expected}",
            )
            if expected and n < int(expected * 0.9):
                print("  incomplete — reseeding chunks")
                rest(
                    f"source_chunks?source_id=eq.{row['id']}",
                    method="DELETE",
                    prefer="return=minimal",
                )
                insert_chunks(row["id"])
                publish_source(row["id"])
            elif row["review_status"] != "published":
                publish_source(row["id"])
            continue

        print("  chars", len(text), "chunks", expected)
        inserted = rest(
            "sources",
            method="POST",
            body={
                "title": title,
                "organization": org,
                "year": year,
                "source_type": source_type,
                "language": "ru",
                "external_url": external_url,
                "copyright_status": copyright_status,
                "license_notes": license_notes,
                "rag_allowed": False,
                "quotation_allowed": True,
                "review_status": "review_required",
                "version": "1.0.0",
            },
        )
        source = inserted[0] if isinstance(inserted, list) else inserted
        if not source or not source.get("id"):
            print("  source insert fail", inserted)
            continue
        insert_chunks(source["id"])
        publish_source(source["id"])
    print("\nDone.")


if __name__ == "__main__":
    main()
