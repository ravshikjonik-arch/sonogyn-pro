# Project Agent Skills (SonoGyn Pro)

## Продукт / клиника

| Skill | Вызов | Назначение |
|-------|--------|------------|
| `sonogyn-pro` | `/sonogyn-pro` | Monorepo, O-RADS unified, parity, команды |
| `clinical-ui-safety` | `/clinical-ui-safety` | CDSS UI, disclaimers, a11y, review |

## Marketing 1.2.0 (Anthropic knowledge-work-plugins)

| Skill | Вызов | Назначение |
|-------|--------|------------|
| `draft-content` | `/draft-content` | Посты, лендинги, PR, кейсы |
| `campaign-plan` | `/campaign-plan` | Бриф кампании, календарь, KPI |
| `brand-review` | `/brand-review` | Проверка на brand voice |
| `competitive-brief` | `/competitive-brief` | Конкуренты и позиционирование |
| `performance-report` | `/performance-report` | Отчёт по метрикам |
| `seo-audit` | `/seo-audit` | SEO-аудит |
| `email-sequence` | `/email-sequence` | Цепочки писем |
| `content-creation` | (auto) | Шаблоны и best practices по каналам |

Источник: `Marketing-1.2.0-v1.zip`. Для SonoGyn: аудитория **врачи**, не пациенты; без обещаний «диагноз/лечение»; согласовать с `clinical-ui-safety` на лендингах калькуляторов.

Установка внешних skills: `sonogyn-pro/references/install-skills.md`.

После добавления skill — **новый Agent-чат** или перезапуск Cursor. Список: **Customize → Skills**.

**Личная копия:** те же 8 skills также в `~/.cursor/skills/` (на все проекты на Mac).
