# 05 — Security Audit (AI / Colibri)

**Scope:** AI Gateway, Colibri client, chat/Evidence. Без дампа PHI/секретов.

## Контроли (VERIFIED)

| Контроль | Где | Оценка |
|----------|-----|--------|
| Auth на AI chat | `/api/ai/chat` | Required (session) |
| PHI heuristic block | `detectPhi` + chat/tutor/orads | Снижает риск; обходится клиническим текстом без паттернов |
| Prompt injection heuristic | `detectPromptInjection` | Слабый слой |
| Log redaction | `redactForAiLog` | Снижает утечки в logs |
| Quota fail-closed | `assertAiGatewayQuota` / cost-control | Daily/monthly |
| Evidence rate limit | chat evidence RL | Yes |
| Secrets in reports | Audit policy | Names only |

## PHI / персональные данные

| Вопрос | Факт | Статус |
|--------|------|--------|
| Обезличивание до cloud | Block-list patterns, не полноценный de-id | PARTIALLY / RISK residual |
| Что уходит провайдеру | User messages + system + citations abstracts/titles | VERIFIED |
| Chat history persist | `chat-sessions` content в Supabase | VERIFIED — ACL/RLS вне этого файла |
| Evidence query log | enterprise audit: query text may be stored | PARTIALLY (сослаться на `02_AI_EVIDENCE_AUDIT`) |
| Images | Vision path; burned-in overlay heuristics в imaging-cds | Separate stack |

**Риск:** врач вставляет ФИО/телефон в свободной форме без маркеров → паттерн может пропустить → **OpenRouter/Perplexity/Colibri** получают текст.

## SSRF / внутренние адреса

| Риск | Деталь | Статус |
|------|--------|--------|
| `COLIBRI_BASE_URL` произвольный | Server-side fetch на env URL | RISK если скомпрометирован env (не user-controlled напрямую) |
| User-controlled provider URL | Не найдено в resolve | VERIFIED absent |
| Localhost на Vercel | Бессмысленный target; не SSRF к VPC без URL | LOW |

## Secrets

- `COLIBRI_API_KEY` default `colibri-local` — ок для local; на remote нужен сильный секрет + TLS.  
- Не коммитить `.env.local`.  
- Vercel env listing — **NOT VERIFIED** в этом прогоне.

## Tenant isolation

- Quota/events по `userId`.  
- Gateway сам по себе multi-tenant только через app auth.  
- Shared Colibri doctor-box: **один процесс — один trust boundary** (не multi-tenant LLM).

## Prompt injection

Heuristic only. Tool calls в clinical mode — отдельный surface. Evidence: citations in prompt could contain adversarial abstracts — **RISK residual** (классика RAG).

## Рекомендации

1. Prod: **не** выставлять `COLIBRI_*` на Vercel без remote hardened endpoint.  
2. Remote Colibri: mTLS/VPN, не публичный `:8000`.  
3. Усилить PHI (опционально allow-list clinical terms).  
4. Не логировать full prompts в plaintext production.

**Итог:** базовая защита есть; **остаточный PHI risk** при передаче в cloud/local LLM реален.
