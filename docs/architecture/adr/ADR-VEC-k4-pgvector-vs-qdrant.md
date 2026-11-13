# ADR-VEC-K4 — Stay on pgvector (defer Qdrant)

**Status:** Accepted · 2026-11-04  
**Supersedes / extends:** `ADR-VEC-pgvector-first.md`  
**Wave:** PR-K4 (decision memo after K2+K3)

## Context

После Wave K2 (HNSW + `match_medical_vault_chunks` + embed) и K3 (hybrid adapter + soft A/B) нужно зафиксировать: остаёмся на **pgvector в Supabase** или вводим **Qdrant**.

Текущий факт:

- Один Postgres / RLS / service_role уже обслуживает vault.
- Hybrid retrieval = adapters + vault, без dual-write.
- Корпус пока мал (fixture + opt-in embed); нет измеренного p95/filter failure.

## Decision

**Остаёмся на pgvector.** Qdrant **не** внедряем до trigger criteria.

## Trigger criteria (когда пересматривать)

Любой **измеренный** пункт (staging/prod metrics, не теория):

| # | Trigger |
|---|---------|
| 1 | p95 `match_medical_vault_chunks` > 400 ms при match_count≤12 и ≥50k published chunks |
| 2 | Нужны фильтры/payload, которые HNSW+SQL не закрывает без тяжёлых seq scans |
| 3 | Оператный read path для non-Postgres workers (mobile offline sync ≠ Qdrant) |
| 4 | Explicit GO на ops budget (отдельный vector cluster)

## Alternatives rejected (now)

| Option | Why not now |
|--------|-------------|
| Qdrant sidecar | Dual ops, sync/embed drift, no measured need |
| Dual-write pgvector+Qdrant | Forbidden by ADR-VEC |
| Replace adapters with vector-only | Клинические adapters (КР/PubMed) обязательны |

## Consequences

- Продолжать: embed job, `EVIDENCE_MEDICAL_VAULT`, ranker boost, soft A/B.
- Не планировать Qdrant в Wave 3 без trigger.
- Следующий knowledge шаг по объёму корпуса (Docling worker / publish chunks) — отдельный GO, не Qdrant.

## Verification (memo acceptance)

- [x] K2 migration applied; embed path works
- [x] K3 hybrid soft A/B green
- [ ] Revisit when any trigger fires → new ADR revision
