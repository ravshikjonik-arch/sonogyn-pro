# AI Infrastructure Hardening — Audit + Change Log

**Дата аудита (этап A):** 2026-11-05  
**Ветка реализации:** `chore/ai-infra-hardening-colibri-optional`  
**Режим этапа A:** READ-ONLY по коду; этап B+ — локальные правки без commit/push/deploy (до разрешения).

Связанный аудит Cloudflare: `docs/audit/COLIBRI_CLOUDFLARE_COMPATIBILITY.md`.

---

## 1. Фактическая архитектура (код)

```text
Client (web)
  → apps/web/app/api/ai/*  (Vercel serverless)
       → resolveProviderChain (gateway/resolve.ts)
       → callOpenRouterChat (OpenAI-compatible HTTP)
       → OpenRouter | Perplexity | Colibri(optional)
Supabase: auth / quota / chat events (метаданные)
```

**Default order (код):** `openrouter → perplexity → colibri`  
**Local timeout:** `LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS = 15_000`  
**Cloud timeout:** `90_000`  
**Failover policy:** `provider-failover.ts` → `shouldFailoverToNextProvider`

---

## 2. Точки входа AI-запросов (VERIFIED)

| Entry | Путь | Gateway chain? |
|-------|------|----------------|
| Clinical / Evidence chat | `app/api/ai/chat/route.ts` | Да (`buildGatewayAttemptChain`) |
| Gateway status | `app/api/ai/gateway/status/route.ts` | Status only (+ Colibri ping) |
| Evidence synthesis | `lib/evidence/synthesize-llm.ts` | `gatewayChatCompletion` |
| Tutor / assist / orads / vision workers | частично вне unified gateway | См. enterprise notes |
| Messenger community tutor | `lib/messenger/ai/*` | Прямой `callOpenRouterChat` |

---

## 3. Зависимости от Colibri (до hardening)

| Место | Проблема |
|-------|----------|
| `resolveColibri`: `(forced === "auto" && Boolean(model))` | **Colibri попадал в chain только из-за `COLIBRI_MODEL`**, даже без `COLIBRI_ENABLED=true` |
| `listConfiguredProviderIds` | Считал Colibri «configured» по одному `COLIBRI_MODEL` → health ping |
| `getGatewayStatus` | Ping `:8000` при «configured» — не на hot path chat, но лишний I/O на status |
| Default `COLIBRI_BASE_URL` | `http://127.0.0.1:8000/v1` — опасно на Vercel если слот включён |
| Chat classic failover | После P0 patch — OK (retryable 5xx/сеть); unit **23/23** |

Colibri **не** был жёстко обязателен при отсутствии model/keys cloud — но мог **задерживать** запрос на 15s, если model задан и sidecar down, а order ставил его раньше cloud (doctor-box) или последним (лишний hop после cloud success — только если предыдущие упали).

---

## 4. Риски (до исправления)

| ID | Риск | Severity |
|----|------|----------|
| R1 | `COLIBRI_MODEL` без explicit enable → слот в chain | High (prod misconfig) |
| R2 | localhost URL на Vercel | High if enabled |
| R3 | 15s wait на мёртвый local, если Colibri в chain и cloud упал | Medium |
| R4 | Health ping не на chat path | Low |
| R5 | PHI в технических логах | Mitigated `logAiChatEvent` (метаданные); residual |
| R6 | Секреты в client bundle | Keys server-only env — verify no `NEXT_PUBLIC_*` for OR/Pplx/Colibri keys |

---

## 5. Существующие тесты

| Набор | Ожидание |
|-------|----------|
| `provider-failover.test.ts` + `resolve.test.ts` | **23/23** (документировано в `docs/audit/colibri/11_P0_FAILOVER_PATCH.md`) |
| После hardening | Те же + новые кейсы optional Colibri (см. § изменения) |

---

## 6. Список необходимых изменений (этап B–F)

1. **Explicit opt-in:** Colibri только при `COLIBRI_ENABLED=true|1|on` **или** `LLM_PROVIDER=colibri`.  
   Одно `COLIBRI_MODEL` **не** включает provider.
2. Health ping Colibri только если enabled.
3. Docs: architecture + failover runbook + cost table.
4. `.env.example`: production default `COLIBRI_ENABLED=false`.
5. Тесты: disabled by default; enabled doctor-box; no call when off.
6. **Не:** менять default cloud-first order; не удалять Colibri; не трогать prod/DNS/Vercel env.

---

## 7. Что исправлено в этой ветке

| Пункт | Статус |
|-------|--------|
| Explicit `COLIBRI_ENABLED` gate | **done** — `isColibriEnabled()` в `resolve.ts` |
| Status ping gate | **done** — ping только если enabled |
| Docs architecture / runbook | **done** |
| New unit tests | **done** — model-only / false / LLM_PROVIDER=colibri |
| Cost / infra table | **done** — §9 ниже |
| Production / DNS / paid resources | **не трогались** |

## 9. Инфраструктурные расходы (оценка, без создания ресурсов)

| Сервис | Тип расхода | Сейчас / при 500 врачах, редкий AI |
|--------|-------------|-------------------------------------|
| Vercel | фиксированный (+overage) | Основной web host — уже есть |
| Supabase | фиксированный (+DB) | Auth/DB — уже есть |
| OpenRouter | переменный (tokens) | Основной AI cost |
| Perplexity | переменный | Failover / evidence text |
| Cloudflare | условный (Free/Pro) | DNS/WAF — не AI host |
| Colibri | условный (VPS/Mac) | **$0**, пока optional/off; VPS ~$45+ только если включите |

**Пока не требуют оплаты из‑за этой задачи:** GPU, CF Containers, Workers AI, R2 (отдельное решение).

**Метрики без медтекста:** provider id, latency, HTTP status, token counts, `estimatedCostUsd`, quota counters — не prompt/response.

---

## 8. Env (целевое)

| Variable | Production | Doctor-box |
|----------|------------|------------|
| `COLIBRI_ENABLED` | `false` или unset | `true` |
| `COLIBRI_BASE_URL` | не localhost; или unset | `http://127.0.0.1:8000/v1` |
| `COLIBRI_MODEL` | optional | `qwen36-35b` |
| `OPENROUTER_API_KEY` | required for AI | recommended |
| `PERPLEXITY_API_KEY` | recommended | optional |
| `LLM_FALLBACK_ORDER` | unset (= cloud-first) или `openrouter,perplexity,colibri` | может `colibri,openrouter,…` **только с** `COLIBRI_ENABLED=true` |
