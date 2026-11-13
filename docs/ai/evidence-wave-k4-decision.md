# Wave K4 — Decision memo (pgvector stay)

**Дата:** 2026-11-04  
**Статус:** принято  
**ADR:** `docs/architecture/adr/ADR-VEC-k4-pgvector-vs-qdrant.md`

## Вердикт

**Остаёмся на Supabase pgvector.** Qdrant откладываем до measured trigger (p95 / filter scale / ops GO).

## Связь с волнами

| Wave | Итог |
|------|------|
| K2 | HNSW + RPC + embed |
| K3 | Hybrid + soft A/B |
| K4 | Этот memo — без install |
