---
name: clinical-ui-safety
description: >-
  Clinical UI and patient-safety patterns for SonoGyn Pro — calculator results,
  CDSS (O-RADS, BI-RADS, IOTA), disclaimers, risk display, PHI-safe forms,
  a11y, dark/light. Use when building or reviewing clinical screens, result
  heroes, protocol preview, alerts, or copy that could be mistaken for a
  diagnosis. Triggers on clinical UI, CDSS, disclaimer, ROM, stratification.
paths:
  - "apps/web/components/calculators/**"
  - "apps/mobile/src/features/**"
  - "packages/ui/**"
  - "packages/orads-us/**"
---

# Clinical UI safety — SonoGyn Pro

Decision support для **врачей**, не для пациентов. Цель: снизить риск **ошибочной интерпретации**, **alert fatigue** и **утечки PHI** в интерфейсе.

Связано: `.cursor/rules/a11y-dark-light.mdc`, `.claude/claude-security-guidance.md`, skill `sonogyn-pro`.

## Когда включать skill

- Новый или изменённый **экран результата** калькулятора / протокола / AI-подсказки.
- **Review** UI без правок — выдать чеклист-отчёт (Pass / Risk / Fix).
- **Копирайт** категорий, ROM, тактики, предупреждений.

## Обязательные элементы результата (CDSS)

1. **Категория/оценка** — явная метка (например «O-RADS 4»), не только цвет.
2. **ROM / уровень риска** — текстом рядом с визуалом; **не только цвет** (WCAG + клиническая ясность).
3. **Обоснование** — кратко, по введённым признакам (без выдуманных полей).
4. **Тактика** — формулировки по гайдлайну/метаданным пакета, не «лечить рак» без контекста.
5. **Дисклеймер** — видим без скролла на desktop для финального результата; на mobile — в том же потоке, не мелким серым в футере сайта:
   - *Не является диагнозом. Интерпретацию выполняет лечащий специалист.*
6. **Неопределённость** — если `category === null` / не хватает полей: **нет** ложной «нулевой» категории; понятный CTA «заполните …».

## Опасные паттерны (избегать)

| Риск | Плохо | Лучше |
|------|--------|--------|
| Color-only | Красная плашка без текста «высокий риск» | Цвет + текст + иконка/метка |
| Диагноз | «Рак яичника», «злокачественное» как итог UI | Категория O-RADS + ROM + тактика ACR |
| Скрытый disclaimer | Только в PDF / tooltip | На экране результата |
| PHI в placeholder | «Иванова М.» в примерах | Нейтральные примеры без ФИО/дат рождения |
| AI как истина | «AI рекомендует операцию» | «Справочно по введённым признакам» |
| Путаница версий | Смешать legacy O-RADS и US v2022 | Явная подпись **O-RADS US v2022** где unified |

## Формы ввода (УЗИ / протокол)

- Placeholder и smoke-тексты — **без реальных ПДн**.
- «Вставить из текста протокола» — напоминание проверить поля; не auto-save сырого текста в облако без продукта/PHI gate.
- Числа: **единицы** (см, мм) рядом с полем; не голые числа в превью.
- Даты в UI — однозначный формат (ДД.ММ.ГГГГ или «фев 2019»), хранение ISO в API.

## Accessibility (клинический контекст)

- Категория доступна скринридеру: `aria-live="polite"` на блоке результата при смене категории (если не ломает тесты).
- Focus на интерактивах; `aria-label` на icon-only (сброс, копировать).
- `prefers-reduced-motion` — без пульсирующих «alarm» анимаций на high-risk.
- Конtrast дисклеймера и ROM — читаем в **dark и light** (`--clinical-*` tokens).

## Review mode (по запросу «проверь UI»)

Выдать отчёт:

```markdown
## Clinical UI safety review
- Screen / component: …
### Critical (patient safety / misinterpretation)
- …
### Major (a11y / disclaimer / PHI)
- …
### Minor (copy / consistency)
- …
### Verified OK
- …
```

Не менять код в review mode, пока пользователь не попросит исправить.

## После правок UI

```bash
pnpm --filter @repo/web test:e2e:a11y          # soft
pnpm --filter @repo/web test:e2e:orads-pro-grid-smoke  # если O-RADS web
```

Ручной smoke: light + dark, mobile tab «Превью», категории 0 / 2 / 4 / 5.

## Вне scope (не подменять врача)

- Не добавлять новые клинические пороги в UI без изменения `packages/*` и тестов.
- Не ссылаться на сырые web-гайдлайны вместо репозиторных `ORADS_US2022_META` / КР без проверки.
