# 06 — Performance & Cost (без платных прогонов)

## Наблюдаемые задержки (код)

| Событие | Верхняя граница в коде |
|---------|-------------------------|
| Colibri attempt timeout | **180_000 ms** (`gateway/chat.ts`, chat route) |
| Cloud attempt timeout | **90_000 ms** |
| Colibri status ping | **2_500 ms** |
| Local maxAttempts | 1 |
| Cloud maxAttempts | 2 (+ backoff 0.5s, 1s) |

ECONNREFUSED обычно **быстрый** fail; hang DNS/TCP — до timeout.

## Лишние / двойные вызовы

| Паттерн | Риск оплаты | Статус |
|---------|-------------|--------|
| Evidence: `synthesizeWithLlm` + второй chat LLM | **До 2×** cloud cost на один UX-запрос | VERIFIED |
| Failover после fail primary | 1 fail + 1 success (обычно не double bill success) | VERIFIED |
| Evidence retrieval fan-out adapters | Много HTTP к PubMed/etc (не LLM $) | VERIFIED (enterprise) |
| AI SDK try Colibri then OR | Possible wasted local attempt | PARTIALLY |

## Vercel serverless

- Function duration limit vs 180s Colibri — **RISK** если Colibri URL reachable but slow on Vercel.  
- localhost Colibri на Vercel бесполезен.  
- Streaming: AI SDK path vs classic SSE — два кода.

## Стоимость: модель расчёта (допущения явные)

**Не выдумываем фактические счета.** Используем telemetry rates из `gateway/cost.ts` (грубые):

| Provider | $/1k prompt | $/1k completion |
|----------|-------------|-----------------|
| colibri | 0 | 0 |
| openrouter (default table) | 0.00015 | 0.0006 |
| perplexity | 0.003 | 0.015 |

### Допущения модели (обязательно указать при использовании)

1. Активный врач = ≥1 AI запрос/мес.  
2. Средний запрос: **2k prompt + 0.5k completion** tokens (одно LLM).  
3. Evidence UX: **×2 LLM** (synthesis + answer) → 4k + 1k.  
4. 20% врачей — тяжёлые Evidence users (×2), 80% — clinical single.  
5. 100% cloud OpenRouter rates выше (консервативно; реальные модели дороже gpt-4o-mini).  
6. Colibri не учитываем в $ (но CAPEX/GPU отдельно).  
7. Retrieval HTTP costs ignored.

### Формула (OpenRouter table rates)

`cost_per_single ≈ (2/1000)*0.00015 + (0.5/1000)*0.0006 = 0.0000003 + 0.0000003 = $0.0000006`  
→ слишком мало vs реальных цен; **таблица в `cost.ts` — telemetry, не биллинг**.

**Практичный подход для 1k / 10k / 100k:**

Пусть \(C\) = средний $ за один **успешный cloud completion** по **реальному** тарифу выбранной модели (из OpenRouter dashboard).  
Пусть \(R\) = запросов на активного врача в месяц.  
Evidence fraction \(e=0.2\) платит \(2C\), остальные \(C\).

\[
\text{Monthly \$} \approx N_{\text{active}} \times R \times C \times (1 + e)
\]

| N registered | Assume 30% MAU active | R=20 | Example if C=$0.01 |
|--------------|----------------------|------|---------------------|
| 1_000 | 300 | 20 | 300×20×0.01×1.2 ≈ **$72** |
| 10_000 | 3_000 | 20 | ≈ **$720** |
| 100_000 | 30_000 | 20 | ≈ **$7_200** |

Если C=$0.05 (более сильная модель): ×5 → **$360 / $3.6k / $36k**.

**Colibri self-host at 100k:** не масштабируется per-doctor laptop; нужен shared GPU fleet — **дороже** VK L40S×2 на одного фаундера; имеет смысл только privacy island / enterprise VPC.

## Рекомендации cost

1. Убрать или сделать optional второй LLM в Evidence (stream rules summary).  
2. Не ставить Colibri first на shared serverless.  
3. Квоты уже есть — держать для free tier.  
4. Сверять `estimated_cost_usd` с реальным OpenRouter invoice (сейчас rates занижены).
