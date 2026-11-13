# Medical Vault — Embed Runbook (P1-6)

**Не включать** `EVIDENCE_MEDICAL_VAULT=1` в production без отдельного GO.  
**Не применять** FTS/pgvector migrations на prod без GO.

## Цель

Заполнить `source_chunks.embedding` (1536-dim) для **published + rag_allowed** чанков, чтобы semantic RPC `match_medical_vault_chunks` возвращал hits.

## Предусловия

1. Migrations applied (staging first):
   - `20260824180000_medical_source_vault.sql` (+ hardening)
   - `20261104140000_medical_vault_pgvector.sql`
   - optional FTS: `20261105120000_medical_vault_fts.sql` (**file only until GO**)
2. Минимум 1 source: ingest → review → Publish (Source Studio `/admin/source-studio`).
3. Env (local/staging, **не коммитить**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY` **или** `OPENAI_API_KEY`
4. Юр. OK на license_notes источника.

## Dry-run

```bash
cd apps/web
DRY_RUN=1 EMBED_LIMIT=5 node scripts/embed-medical-vault-chunks.mjs
```

Ожидание: список chunk id без UPDATE.

## Embed batch

```bash
EMBED_LIMIT=20 node scripts/embed-medical-vault-chunks.mjs
```

Повторять, пока SQL ниже не покажет целевой N.

## Проверка status (SQL, staging)

```sql
select
  count(*) filter (where embedding is not null) as embedded,
  count(*) as published_chunks
from public.source_chunks c
join public.sources s on s.id = c.source_id
where s.review_status = 'published'
  and s.rag_allowed = true
  and c.review_status in ('published', 'reviewed', 'extracted');
```

Рекомендация перед флагом: **embedded ≥ 20** (или все published chunks).

## Feature flag

После N embedded на **staging**:

```bash
# .env.local / Vercel Preview only — не prod без GO
EVIDENCE_MEDICAL_VAULT=1
```

UI/API: `GET /api/evidence/assistant/ask` → `medicalVault.reason` (`disabled` | `no_embed_key` | `ready`).

Optional keyword channel (после FTS migration GO):

```bash
EVIDENCE_MEDICAL_VAULT_FTS=1
```

## Rollback

1. Убрать `EVIDENCE_MEDICAL_VAULT` / `EVIDENCE_MEDICAL_VAULT_FTS` из env.
2. Embeddings можно оставить (не ломают retrieval при флаге off).
3. Не удалять chunks без editorial GO.

## Запрещено без GO

- Prod migrate / reindex all
- GPU / Qdrant
- Книги без `license_notes`
- Включение semantic vault на Vercel Production
