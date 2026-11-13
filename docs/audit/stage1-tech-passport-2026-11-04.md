# Этап 1 — Техпаспорт SonoGyn Pro

**Дата:** 2026-11-04  
**Статус:** черновик аудита (секреты не раскрывались)  
**Canvas:** `sonogyn-stage1-tech-passport` (Cursor canvases)

## Вердикт

AI Evidence уже multi-adapter + опциональный LLM, но **не** независимый AI Gateway и **не** полноценный medical RAG. pgvector установлен, pipeline эмбеддингов отсутствует. Colibri не подключён. Учёт стоимости — фрагментарный.

## 1. Vercel

| Поле | Значение |
|------|----------|
| Project (link) | `sonogyn-pro-web` · `prj_nAr2PIQic34JrIGYepxd9efGR4Fb` |
| Team | `team_YCy2Bmmj4LoEuO4FTZHMRAjH` · `ravshan-s-projects3` |
| MCP | **403** — нужна authorize_team_access (prod env / deployments не прочитаны) |
| Prod URL (правила) | `https://sonogyn-pro-web-ravshan-s-projects3.vercel.app` |

## 2. Supabase

| Поле | Значение |
|------|----------|
| Project | `Sonogyn-Pro` · `grnwcbyslttbrqznnunq` |
| Region | `eu-west-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | 17.6 |
| pgvector | **installed** `0.8.2` |
| profiles / users | 60 / 60 |
| Knowledge vault | sources 2 · chunks 1 · articles 1 |
| evidence_query_log | 0 rows |
| Security advisors | 1 INFO + 4 WARN |
| Performance advisors | unindexed FKs, RLS init plan, unused indexes, multi permissive policies |

## 3. AI-провайдеры

| Провайдер | Роль | Env |
|-----------|------|-----|
| Perplexity | text / Evidence | `PERPLEXITY_*` |
| OpenRouter | chat, vision, tutor, messenger, STT | `OPENROUTER_*` |
| OpenAI | Whisper fallback | `OPENAI_*` |
| US AI Worker | УЗИ vision | `US_AI_WORKER_*` |
| Protocol AI | orads-from-text | `PROTOCOL_AI_*` |
| CPI | colposcopy | `CPI_AI_COLPOSCOPY_*` |
| Colibri | local `:8000/v1` | **не wired** |

Центр: `apps/web/lib/ai/llm-provider.ts` (ещё не полный Gateway).

## 4. AI Evidence

```
UI → /api/evidence/assistant/ask
  → @repo/evidence-retrieval (adapters)
  → rank/dedupe
  → synthesize-llm (Perplexity|OpenRouter) или template
  → evidence_query_log + RL
```

Лимиты: Assistant **20/60s**, Search **40/60s**, Free chat **20/30d**.

Medical Knowledge (`/api/medical-knowledge/retrieve`) — keyword/SQL, не vector.

## 5. RAG / embeddings

- Схема: `source_chunks.embedding vector(1536)` — **пустое будущее**.
- Генерации эмбеддингов в коде **нет**.
- Chat RAG-lite = локальные JSON сниппеты правил.

## 6. Секреты (локальный `.env.local`)

| Переменная | Статус |
|------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | set |
| `SUPABASE_SERVICE_ROLE_KEY` | set |
| `OPENROUTER_API_KEY` | missing |
| `PERPLEXITY_API_KEY` | missing |
| `US_AI_WORKER_URL` / `SECRET` | set |
| `UPSTASH_REDIS_*` | missing |
| `COLIBRI_*` | missing |

## 7. Gaps → этапы 2–6

| ID | Gap | Этап |
|----|-----|------|
| G1 | Нет единого AI Gateway | 2 |
| G2 | Нет embedding pipeline | 4 |
| G3 | Нет per-doctor $ / полный cost ledger | 2 |
| G4 | Colibri не подключён | 5 |
| G5 | Vercel MCP auth | 1 follow-up |
| G6 | Supabase security WARN | 6 / hardening |

## Следующий шаг (обновлено 2026-11-04)

1. Approve Vercel team access → дочитать prod env (всё ещё follow-up).  
2. **Этап 2:** AI Gateway + chat failover + Colibri wiring.  
3. **Этап 3 (код):** индексы-миграция (не применена на prod), Redis evidence cache, regulation worker cron, health DB latency — `docs/operations/stage3-infra.md`.  
4. Дальше: apply migration на staging; Этап 4 RAG/embeddings.
