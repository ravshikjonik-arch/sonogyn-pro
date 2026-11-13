# SONOGYN PRO / COLIBRI — Infrastructure Compatibility Audit (Cloudflare)

**Дата:** 2026-11-05  
**Режим:** READ-ONLY (код + локальный FS + существующие аудиты `docs/audit/colibri/*`).  
**Запрещено в этом этапе (соблюдено):** менять production, DNS, Vercel, Supabase, код runtime, удалять Colibri, менять failover order, ставить GPU/платные ресурсы.

---

## 1. Executive verdict

| Вопрос | Ответ |
|--------|--------|
| Можно ли **запустить Colibri inference** внутри Cloudflare Workers / Workers AI / R2? | **Нет** |
| Можно ли Cloudflare Containers «заменить» ваш `qwen36-35b` sidecar в бюджете $50–100? | **Практически нет** (RAM/модель/стоимость) |
| Ломается ли платформа, если Colibri down? | **Нет**, при cloud-first + наличии OpenRouter/Perplexity (failover 23/23 unit) |
| Где должен жить Colibri? | **Optional sidecar**: Mac врача / отдельный VPS (не Cloudflare edge) |
| Что оставить где | **Vercel** = web; **Supabase** = data; **Cloudflare** = DNS/WAF/CDN перед Vercel; **Colibri** = вне Cloudflare |

**Рекомендуемая архитектура сейчас: вариант C** (Colibri optional/off в prod) + Cloudflare только как щит для сайта. GPU-сервис (A) и always-on VPS (B) — отложить до явной потребности в private inference.

---

## 2. Карта кода Colibri (факт)

| Роль | Путь |
|------|------|
| Resolve / chain | `apps/web/lib/ai/gateway/resolve.ts` |
| Unified completion + failover | `apps/web/lib/ai/gateway/chat.ts` |
| Health / status | `apps/web/lib/ai/gateway/status.ts` → `GET /api/ai/gateway/status` |
| HTTP client (OpenAI-compatible) | `apps/web/lib/ai/sonogyn-chat/openrouter-client.ts` |
| Failover policy + **15s** local timeout | `apps/web/lib/ai/sonogyn-chat/provider-failover.ts` |
| Chat API consumer | `apps/web/app/api/ai/chat/route.ts` |
| Evidence LLM | `apps/web/lib/evidence/synthesize-llm.ts` → gateway |
| AI SDK adapter | `apps/web/lib/ai/sdk/provider.ts` |
| Types | `apps/web/lib/ai/gateway/types.ts` (`colibri \| openrouter \| perplexity`) |
| Ops scripts | `scripts/colibri/*`, `integrations/colibri/README.md` |
| Docs | `docs/integrations/colibri.md`, `docs/ai/gateway.md` |
| Prior audits | `docs/audit/colibri/00`…`15` |
| Unit failover | `…/provider-failover.test.ts` + `gateway/__tests__/resolve.test.ts` → **23/23 pass** (patch `11_P0_FAILOVER_PATCH.md`) |

### Конфигурация (env, имена)

| Переменная | Назначение |
|------------|------------|
| `COLIBRI_ENABLED` | Вкл. слот Colibri |
| `COLIBRI_BASE_URL` | Default `http://127.0.0.1:8000/v1` |
| `COLIBRI_MODEL` / `COLIBRI_EVIDENCE_MODEL` / `COLIBRI_VISION_MODEL` | Model ids |
| `COLIBRI_API_KEY` | Bearer (local default `colibri-local`) |
| `LLM_PROVIDER` | `auto` \| forced |
| `LLM_FALLBACK_ORDER` | Override order |
| `LLM_STRICT_PROVIDER=1` | Без failover |

**Default order в коде (cloud-first):**  
`openrouter → perplexity → colibri` (`resolve.ts`).

**Timeouts:**

| Провайдер | Константа | Значение |
|-----------|-----------|----------|
| Local (Colibri) | `LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS` | **15 000 ms** |
| Cloud | `CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS` | 90 000 ms |
| Health ping Colibri | `status.ts` | 2 500 ms |

**Протокол:** HTTP OpenAI-compatible `POST …/v1/chat/completions`, health `GET …/v1/models`.  
**Порт (local):** `8000`.

---

## 3. Фактические требования Colibri (runtime)

Источник: Colibri upstream README + SonoGyn docs (`qwen36-35b`), локальный FS 2026-11-05.

| Параметр | Факт / оценка |
|----------|----------------|
| Продукт | [JustVugg/colibri](https://github.com/JustVugg/colibri) — native C engines, MoE experts с диска |
| Модель (SonoGyn default) | `qwen36-35b` |
| Размер модели (полный) | **~20–23+ GB** на диске (docs: `coli setup` ~20+ GB) |
| Локально сейчас | `~/colibri-models/qwen36-35b` ≈ **1.3 GB**, shards partial → **не готова**; `:8000` **down** |
| Формат | Safetensors / Colibri engine packs; также GGUF на CPU/Vulkan/CUDA |
| RAM (минимум upstream) | **8 GB** absolute; **16 GB+** better |
| RAM (ваша модель) | **~20 GB** resident (docs: fits Mac ~20 GB) |
| GPU | **Не обязателен** (CPU MoE); GPU optional (Vulkan/CUDA) для скорости |
| VRAM | Не требуется для базового CPU path |
| CPU | Многопоточный; на слабом VPS ответы медленные vs 15s timeout → риск timeout→failover |
| Диск | ≥22 GB free на маленькую модель; для qwen36 — **≥30–40 GB** с запасом |
| Runtime | Native binary `coli` + Python setup; **не** «одна JS-функция» |
| Docker | Возможен self-host контейнер, но **не** часть Cloudflare Workers |
| Холодный старт | Десятки секунд (upstream пример ~32s ready); несовместим с Worker cold invoke |
| Inference API | Long-lived process, stateful model in RAM/disk |

**Вывод по железу:** Colibri = **долгоживущий процесс с большой RAM/диском**, не edge function.

---

## 4. Совместимость с продуктами Cloudflare (раздельно)

### 4.1 Cloudflare Workers (isolate)

| Критерий | Совместимость |
|----------|----------------|
| Запуск `coli` / native C | **Нет** |
| Загрузка 20 GB модели в память Worker | **Нет** (лимиты памяти/CPU) |
| HTTP proxy к внешнему Colibri URL | **Да** (как тонкий reverse proxy) — но это не «Colibri на Cloudflare» |
| Соблюдение 15s timeout Vercel→Colibri | Proxy добавляет hop; не решает RAM |

**Несовместимость:** нет native runtime, нет persistent multi-GB model memory, CPU time limits.

### 4.2 Cloudflare Workers AI

| Критерий | Совместимость |
|----------|----------------|
| Запуск вашего Colibri / `qwen36-35b` | **Нет** — каталог моделей CF, не JustVugg Colibri |
| Как ещё один cloud provider в цепочке | **Возможно в будущем** (новый adapter) — это **не** Colibri |
| Замена OpenRouter/Perplexity | Отдельный продуктовый/юр. выбор |

**Не смешивать:** Workers AI ≠ Colibri.

### 4.3 Cloudflare Containers

| Критерий | Совместимость |
|----------|----------------|
| Теоретически контейнер с Linux + coli | **Частично** (если продукт даёт достаточный RAM/диск) |
| `qwen36-35b` (~20 GB RAM) в типичном CF Container SKU | **Маловероятно / вне бюджета $50–100** |
| Always-warm inference | Дорого vs rare AI у 500 врачей |
| Операционная сложность | Высокая vs текущий Vercel+cloud |

**Вердикт:** не целевой путь при бюджете и редких запросах.

### 4.4 Cloudflare R2

| Критерий | Совместимость |
|----------|----------------|
| Хранение весов модели / бэкапов | **Да** (object storage) |
| Inference | **Нет** |

R2 может хранить артефакты; **не** запускает Colibri.

### 4.5 Cloudflare как CDN / DNS / WAF (перед Vercel)

| Критерий | Совместимость |
|----------|----------------|
| Proxy `sonogyn-pro.ru` → Vercel | **Да** (уже в ops-чеклистах) |
| Влияние на Colibri | **Нет** (Colibri не на этом hop) |
| DDoS / Bot Fight для `/api/*` | **Полезно** для web |

---

## 5. Таблица совместимости (сводка)

| Компонент | Colibri process | Model weights | SonoGyn gateway client | Примечание |
|-----------|-----------------|---------------|------------------------|------------|
| Vercel (Next API) | ❌ host | ❌ | ✅ вызывает HTTP | Prod cloud-first |
| Supabase | ❌ | ❌ | ❌ (данные/auth) | Не AI host |
| CF Workers | ❌ | ❌ | ⚪ optional proxy | Не inference |
| CF Workers AI | ❌ (другой продукт) | ❌ your model | ⚪ future adapter | Не Colibri |
| CF Containers | ⚪ theoretical | ⚪ if huge SKU | ⚪ | Бюджет/RAM |
| CF R2 | ❌ | ✅ store only | ❌ | |
| CF DNS/WAF/CDN | N/A | N/A | ✅ front door | Рекомендуется для web |
| Mac / doctor-box | ✅ | ✅ | ✅ localhost | Целевой optional |
| VPS 32 GB (напр. DLine Combo 6) | ✅ CPU | ✅ | ✅ remote URL | Дорого vs rare use |
| GPU cloud on-demand | ✅ faster | ✅ | ✅ | Вариант A |

---

## 6. Три архитектурных варианта

### A. Colibri как GPU/CPU сервис по требованию

- Поднять inference (RunPod / Vast / свой GPU) только когда нужен private LLM.
- Vercel `COLIBRI_BASE_URL=https://…` + auth; cloud-first или colibri в order по флагу.
- **Плюс:** нет always-on счёта; **минус:** cold start ≫ 15s → почти всегда timeout→OpenRouter; ops сложность.
- **При редких запросах 500 врачей:** cold start делает Colibri почти бесполезным без warm pool (дорого).

### B. Colibri на constantly-on VPS (CPU, без GPU)

- Пример: DLine **Combo 6** ~4 550 ₽/мес (~$45–55) — только RAM под модель; GPU нет.
- **Плюс:** warm process; **минус:** постоянная оплата при редком AI; CPU latency vs 15s; нужен TLS/auth/firewall.
- В бюджете $50–100 почти **весь** бюджет уходит на VPS, мало запаса на OpenRouter.

### C. Colibri временно optional / off в prod; AI = OpenRouter → Perplexity

- Код Colibri **сохраняется**; prod без `COLIBRI_BASE_URL=127.0.0.1` и без colibri-first.
- Doctor-box: локальный sidecar когда модель готова.
- **Плюс:** мин. infra cost; failover уже cloud-first; **минус:** нет private local LLM в prod до отдельного решения.

---

## 7. Стоимость (оценка, редкие AI-запросы)

Допущения: ~500 врачей; AI редко (порядок **десятки–сотни** chat/evidence вызовов в месяц, не continuous). Курсы условные.

| Вариант | Infra / мес | AI API / мес ( Ord. of magnitude ) | Итого vs $50–100 |
|---------|-------------|-------------------------------------|------------------|
| **A** on-demand GPU | $0 idle; session $0.5–3+/час GPU | + OpenRouter fallback | Выгодно только при редких длинных сессиях; cold start vs 15s — плохо |
| **B** VPS 32 GB CPU | ~$45–60 (Combo 6) | + OpenRouter всё равно нужен | На грани бюджета; Colibri может часто timeout |
| **C** cloud-only (+ optional local) | **$0** Colibri infra | OpenRouter+Perplexity: при редких запросах часто **$5–40**/мес | **Лучше всего** вписывается в $50–100 |
| Cloudflare DNS/WAF (free–Pro) | $0–20 | — | Совместимо с C |

**Vercel + Supabase** (уже есть) — основной fixed cost платформы; Colibri не должен их дублировать.

---

## 8. Failover: ломается ли цепочка без Colibri?

| Механизм | Поведение если Colibri недоступен |
|----------|-----------------------------------|
| Default `resolveProviderChain` | Colibri **последний**; cloud идут первыми |
| `gatewayChatCompletion` | Пробует всех по цепочке |
| `/api/ai/chat` после P0 patch | `shouldFailoverToNextProvider` на сеть/5xx/timeout |
| Unit tests | **23/23 pass** (`11_P0_FAILOVER_PATCH.md`) |
| `COLIBRI_ENABLED=false` / нет model | Слот не в chain → только cloud |
| Misconfig: prod `COLIBRI_BASE_URL=127.0.0.1` + colibri-first | **Риск** задержки/ошибок — ops: не ставить так на Vercel |

**Вывод:** при корректном cloud-first и ключах OpenRouter/Perplexity отключение Colibri **не должно** останавливать платформу. Colibri остаётся **необязательным** provider.

---

## 9. Целевая архитектура (рекомендация)

```text
Врач → Cloudflare (DNS/TLS/WAF/CDN) → Vercel Next.js
                                         ├─ Supabase (Auth/DB/Storage)
                                         ├─ OpenRouter  ─┐
                                         ├─ Perplexity  ─┼─ LLM_FALLBACK_ORDER cloud-first
                                         └─ Colibri?    ─┘  optional
                                              │
                    только если URL достижим с Vercel
                    (НЕ 127.0.0.1; doctor-box или будущий VPS)
```

- **Не** переносить Colibri на Workers / Workers AI / R2-as-compute.  
- **Не** менять порядок failover без отдельного обоснования (сейчас cloud-first корректен для prod).  
- Cloudflare = защита web, не AI host.

---

## 10. Необходимые изменения кода (только список — НЕ делать без разрешения)

| Приоритет | Изменение | Зачем |
|-----------|-----------|--------|
| P2 (опц.) | Health-aware skip: не звать Colibri если `getGatewayStatus` unhealthy | Меньше 15s ожиданий |
| P2 (опц.) | Circuit breaker после N fails | То же |
| P3 | Адаптер Cloudflare Workers AI как **четвёртый** provider | Не Colibri; отдельная фича |
| Ops | Проверка Vercel env: нет localhost Colibri / нет colibri-first | Уже в `15_OPS_SMOKE.md` |
| Docs | Этот файл | Готово |

**Сейчас код менять не требуется** для совместимости с Cloudflare edge: Colibri и CF почти ортогональны.

---

## 11. Риски и план тестирования (после вашего «ок»)

| Риск | Митигация / тест |
|------|------------------|
| Prod env с `127.0.0.1` Colibri | Vercel env audit (names only); smoke `/api/ai/gateway/status` |
| 15s local timeout на медленном CPU VPS | Нагрузочный ping; иначе Colibri бесполезен → только cloud |
| Двойной LLM в Evidence | См. audit `06` / cost docs |
| PHI на remote Colibri URL | TLS + auth + no logs PHI (`mcp-safety`) |
| Регрессия failover | `node --import tsx --test` provider-failover + resolve (23+) |

Тест-план без платных вызовов: unit + gateway status; с ключами — один smoke chat с Colibri down (ожидание: OpenRouter OK).

---

## 12. Однозначный вывод: что где

| Слой | Где |
|------|-----|
| Web (Next.js 16) | **Vercel** — оставить |
| Auth / DB / Storage / RLS | **Supabase** — оставить |
| DNS, TLS, DDoS, Bot, CDN | **Cloudflare** (перед Vercel) — можно/нужно для сайта; **не** для Colibri |
| OpenRouter + Perplexity | Вызовы с **Vercel** API routes — primary AI |
| **Colibri** | **Не Cloudflare.** Optional: локальный Mac / будущий VPS ≥32 GB RAM; в prod — last resort или выкл. до готовности модели |

**Итоговая рекомендация:** вариант **C** + Cloudflare как фронт к Vercel; **не** арендовать GPU/VPS «ради Cloudflare»; Colibri в коде сохранить как optional provider.

---

## 13. Стоп

Отчёт готов. **Инфраструктура и код не изменялись** в рамках этого аудита. Дальнейшие шаги — только после вашего разрешения.
