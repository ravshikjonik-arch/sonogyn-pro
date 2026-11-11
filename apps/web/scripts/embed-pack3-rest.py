#!/usr/bin/env python3
"""Embed newly published pack3 chunks via curl --resolve + OpenRouter."""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FORCED_IP = "104.18.38.10"
BATCH = 16
PAGE = 80

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
OPENROUTER = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
OPENAI = (os.environ.get("OPENAI_API_KEY") or "").strip()
MODEL = (
    os.environ.get("OPENROUTER_EMBEDDING_MODEL")
    or ("openai/text-embedding-3-small" if OPENROUTER else "text-embedding-3-small")
).strip()
EMBED_URL = (
    ((os.environ.get("OPENROUTER_API_URL") or "https://openrouter.ai/api/v1").rstrip("/").removesuffix("/chat/completions"))
    + "/embeddings"
    if OPENROUTER
    else "https://api.openai.com/v1/embeddings"
)
API_KEY = OPENROUTER or OPENAI

SOURCE_IDS = [
    "f231a51c-4fcd-4d8c-b9b9-6063034621c8",
    "553bd61b-1750-455b-aa16-eb7336525eb9",
    "4197b80c-9da2-4e46-94bd-763d9864960f",
    "a46de007-273d-452c-b10c-21bcf862f07e",
    "66044cbf-5e21-47e1-9a55-9d26e9f29a7a",
    "90b3eeb6-fe57-4c5b-bfe1-cb094afb60c7",
    "f752e36d-0d81-4ca3-a35c-b9c3a8f1a989",
    "b02802b2-d4f1-47ef-8963-31b2215c0205",
]


def sb(path: str, method: str = "GET", body=None, prefer: str = "return=representation"):
    endpoint = f"{URL}/rest/v1/{path}"
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
        raise RuntimeError(proc.stderr.strip() or proc.stdout[:300])
    out = proc.stdout
    body_text, code = out.rsplit("__HTTP__", 1)
    code = code.strip()
    if not code.startswith("2"):
        raise RuntimeError(f"{method} {path} {code}: {body_text[:400]}")
    body_text = body_text.strip()
    return json.loads(body_text) if body_text else None


def embed_batch(texts: list[str]) -> list[list[float]]:
    payload = {"model": MODEL, "input": [t[:8000] for t in texts]}
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    if OPENROUTER:
        headers["HTTP-Referer"] = os.environ.get("NEXT_PUBLIC_APP_URL") or "https://sonogyn.pro"
        headers["X-Title"] = "SonoGyn vault embed"
    req = urllib.request.Request(
        EMBED_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    items = sorted(data.get("data") or [], key=lambda x: x.get("index", 0))
    vectors = []
    for item in items:
        vec = item.get("embedding")
        if not isinstance(vec, list) or len(vec) != 1536:
            raise RuntimeError(f"bad embedding dims {len(vec) if isinstance(vec, list) else None}")
        vectors.append(vec)
    if len(vectors) != len(texts):
        raise RuntimeError(f"embed count mismatch {len(vectors)}!={len(texts)}")
    return vectors


def main():
    print("SUPABASE:", "найдено" if URL and KEY else "нет")
    print("EMBED KEY:", "openrouter" if OPENROUTER else ("openai" if OPENAI else "нет"))
    if not URL or not KEY or not API_KEY:
        raise SystemExit(1)

    ids_filter = ",".join(SOURCE_IDS)
    updated = 0
    while True:
        rows = sb(
            "source_chunks"
            f"?source_id=in.({ids_filter})"
            "&embedding=is.null"
            "&review_status=eq.published"
            "&select=id,content,sanitized_content"
            f"&limit={PAGE}"
        )
        if not rows:
            break
        print(f"page candidates: {len(rows)}")
        page_embedded = 0
        skipped_short = []
        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            texts = []
            keep = []
            for row in batch:
                text = (row.get("sanitized_content") or row.get("content") or "").strip()
                if len(text) < 20:
                    print("skip short", row["id"])
                    skipped_short.append(row["id"])
                    continue
                texts.append(text)
                keep.append(row)
            if not texts:
                continue
            for attempt in range(5):
                try:
                    vectors = embed_batch(texts)
                    break
                except Exception as e:
                    wait = 2 ** attempt
                    print(f"embed retry {attempt+1}: {e}; sleep {wait}s")
                    time.sleep(wait)
            else:
                raise RuntimeError("embed failed after retries")
            for row, vec in zip(keep, vectors):
                for attempt in range(5):
                    try:
                        sb(
                            f"source_chunks?id=eq.{row['id']}",
                            method="PATCH",
                            body={"embedding": vec},
                            prefer="return=minimal",
                        )
                        break
                    except Exception as e:
                        wait = 2 ** attempt
                        print(f"patch retry {attempt+1} {row['id']}: {e}; sleep {wait}s")
                        time.sleep(wait)
                else:
                    raise RuntimeError(f"patch failed {row['id']}")
                updated += 1
                page_embedded += 1
            print(f"embedded +{len(keep)} total={updated}")
        # Avoid infinite loop on permanently-skipped short chunks.
        if page_embedded == 0:
            print(f"stop: no embeddable rows left (short skipped={len(skipped_short)})")
            break
    print(f"ok embedded {updated}")


if __name__ == "__main__":
    main()
