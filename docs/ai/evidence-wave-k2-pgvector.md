# Wave K2 — Medical vault pgvector (ADR-VEC)

**Дата:** 2026-11-04  
**Статус:** код в репо; миграция **применена на prod** `Sonogyn-Pro` (`grnwcbyslttbrqznnunq`) 2026-11-04 → имя `medical_vault_pgvector` (по явному запросу).

## Что сделано

1. SQL: HNSW + RPC `match_medical_vault_chunks` (service_role).
2. Evidence adapter `medical_vault` (skip без `medicalVaultSearch`).
3. Web: embed query + RPC при `EVIDENCE_MEDICAL_VAULT=1`.
4. Opt-in embed job для чанков без embedding.

## Проверка (soft)

```bash
pnpm test:evidence-retrieval
pnpm --filter @repo/web typecheck
```

## Включение на staging/prod (отдельный GO)

1. Apply migration `20261104140000_medical_vault_pgvector` (staging first).
2. Publish source + chunks with `rag_allowed=true`.
3. `pnpm embed:medical-vault` (или dry-run).
4. Env: `EVIDENCE_MEDICAL_VAULT=1` + embedding API key + service role.
5. Smoke: Evidence Assistant «Все источники» — provider Medical Vault в sourcesUsed.
