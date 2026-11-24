# Платформа SonoGyn Pro — стабильность, РФ без VPN, автоконтент (2026)

**Персоны:** врач-практик (главная), ординатор, самопроверка.  
**Принцип:** калькуляторы и нормы — **локально/быстро**; Evidence, ИИ, чат — **через sonogyn-pro.ru**; зарубежные LLM — **резерв**, не единственный путь.

## Целевая схема

```text
Mobile                          Web (sonogyn-pro.ru)
├─ @repo/* калькуляторы офлайн   ├─ те же пакеты
├─ кэш справочников (волна 1)   ├─ Evidence API
└─ API только .ru                └─ chat Supabase + cron ingest

Contент: packages/clinical-guidelines (+ weekly sync КР)
ИИ: llm.*.ru (Colibri) → OpenRouter/Perplexity fallback
Vision O-RADS: /api/ai/gyn-assist (волна 3 mobile parity)
```

## Волны

| # | Название | Результат для врача | Статус |
|---|----------|---------------------|--------|
| **0** | LLM РФ-first | ИИ без VPN на типовых сценариях | runbook `colibri-vps-24x7-runbook.md` |
| **1** | Скорость | Мгновенный старт, CDN, mobile bundle | **в работе** — public whats-new CDN + mobile офлайн лента КР |
| **2** | Авто-КР | «Новое» из diff рубрикатора | **старт** — sync + GHA + whats-new |
| **3** | O-RADS фото mobile | Вау на телефоне | **готово** `a38e752c` — gyn-assist open/Bearer + галерея/камера в O-RADS assist |
| **4** | Один чат | Supabase only, без legacy server | план |

## Волна 2 — что сделано в старте

1. `pnpm sync:guidelines` пишет `synced-kr-mz-rf.changelog.json` (новые / новая версия КР).
2. Evidence «Новое» подмешивает пункты из changelog.
3. GitHub Actions `sync-kr-rubricator.yml` — понедельник 05:00 UTC (нужен push в default branch).

**Ручной прогон:** из корня `pnpm sync:guidelines`.

## Волна 0 — следующие шаги

См. `docs/operations/llm-russia-first.md`.

## Метрики «всё летает»

- LCP web < 2.5s на калькуляторах (волна 1).
- Mobile cold start: consent → калькулятор < 3s.
- Evidence search P95 < 4s (кэш PubMed).
- KR sync: changelog в UI в течение 24h после публикации в рубрикаторе.

## Что не делаем

- Не переносим весь PubMed в offline.
- Не дублируем Vercel на AWS «с нуля».
- Не автодиагноз по фото без подтверждения врача (O-RADS assistive only).