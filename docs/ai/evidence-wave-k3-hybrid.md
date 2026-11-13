# Wave K3 — Hybrid vault + adapters (PR-K3)

**Дата:** 2026-11-04  
**Статус:** реализовано (soft A/B, без Qdrant / без новых миграций)  
**Персоны:** врач-практик · Evidence Assistant

## Цель

Векторный Medical Vault — **добавочный** канал рядом с keyword adapters (КР, PubMed, static), а не замена.

## Что сделано

1. Умеренный `PROVIDER_BOOST.medical_vault = 0.05` в `ranker` (ниже `kr_mz_rf` / Cochrane).
2. Soft A/B: `pnpm --filter @repo/evidence-retrieval eval:hybrid-ab:soft`  
   — vault-off → `skipped`; vault-on → quote в ranked records.
3. Unit: vault выше pubmed `other` при равном score; KR guideline остаётся выше vault.

## Проверка

```bash
pnpm --filter @repo/evidence-retrieval test
pnpm --filter @repo/evidence-retrieval eval:hybrid-ab:soft
pnpm test:evidence-retrieval
```

## Ручной smoke (локально)

1. `.env.local`: `EVIDENCE_MEDICAL_VAULT=1` + embed key + service role.
2. Перезапустить `next dev` после смены env.
3. `GET /api/evidence/search?q=Endometrioma%20ground%20glass&providers=medical_vault`

**Smoke 2026-11-04:** `medical_vault` → `ok`, n=1, quote fixture endometrioma (после restart Next).  
Запрос `O-RADS` → `ok` n=0 (нет semantic match к fixture) — ожидаемо.

## Не в scope (HOLD)

Docling full pip, LiteLLM, prod `EVIDENCE_MEDICAL_VAULT` без отдельного GO.  
Qdrant — см. K4 ADR (defer).
