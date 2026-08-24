# Medical Knowledge Architecture — SonoGyn Pro

Clinical Knowledge Infrastructure: closed source vault → canonical knowledge → RAG → structured answers for doctors.

**Principle:** `ORIGINAL SOURCE ≠ USER CONTENT`. Clinicians never receive PDFs, storage paths, raw chunks, or signed vault URLs.

See migration `apps/web/supabase/migrations/20260824180000_medical_source_vault.sql` and package `@repo/medical-knowledge`.

## Pipeline

```
PRIVATE SOURCE VAULT → INGESTION → SOURCE CHUNKS → MEDICAL REVIEW → CANONICAL KNOWLEDGE → RAG → UI
```

## Tables

`sources`, `source_files`, `source_chunks`, `medical_reviews`, `knowledge_articles`, `knowledge_sections`, `knowledge_sources`, `knowledge_links`, `canonical_calculator_registry`, `canonical_calculator_versions`, `canonical_calculator_sources`, `rag_query_logs`, view `source_catalog_public`.

## Security

- Bucket `medical-source-vault` (private)
- RLS: clinicians DENY on vault tables; published knowledge SELECT only
- API never returns chunk text or storage_path
- `sanitizeMedicalSource()` + copyright guard + prompt-injection markers

## UI routes

- `/tools/refs/medical-knowledge` — Medical Knowledge Assistant
- `/tools/refs/clinical-guide/endometrioma-demo` — ClinicalGuide demo
- `/admin/source-studio` — editor admin (author/admin)

## Tests

`pnpm --filter @repo/medical-knowledge test`

## TODO

Ingestion worker, pgvector hybrid search, chat mode integration, legal license workflow before real book upload.
