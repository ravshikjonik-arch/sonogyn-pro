# Docling ingest spike (GO-W1+K1)

**Цель:** PDF/DOCX → структурированные чанки для `public.source_chunks` **без** Qdrant и без merge в prod pipeline.

**Статус:** research spike. Не подключён к Vercel cron. Не пишет в prod DB без явного флага.

## Принцип

SonoGyn vault schema уже есть (`sources` / `source_files` / `source_chunks`). Docling — **worker**, не замена `@repo/evidence-retrieval`.

```text
PDF (открытый КР / demo) → Docling → JSON chunks → (optional) staging Supabase insert
```

## Локальный soft-check (без Docling)

```bash
python3 services/docling-ingest/spike_markdown_chunker.py \
  --input services/docling-ingest/fixtures/sample_guideline.md \
  --out /tmp/sonogyn-docling-chunks.json
```

Проверяет контракт чанков (title, page, text, hash) совместимый с vault.

## Полный Docling (opt-in)

```bash
cd services/docling-ingest
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-docling.txt
python run_docling_spike.py --input path/to/open.pdf --out /tmp/chunks.json
```

Требует Python ≥3.10, диск под модели OCR. **Не** ставьте в `apps/web` dependencies.

## Следующий шаг после spike

ADR-VEC: embed → `source_chunks.embedding` (pgvector) и bake-off vs Qdrant — отдельный GO.
