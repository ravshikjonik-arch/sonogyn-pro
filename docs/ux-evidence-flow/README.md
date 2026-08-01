# Evidence Assistant — UI/UX flow screenshots

Снято локально (`DEV_SKIP_AUTH=true`, localhost:3000) после P0 corpus modes.

## Карта флоу

```text
Точки входа
├── /tools/refs                 → карточка «Evidence Assistant · AI»
├── Sidebar · Помощник · EBM    → Evidence AI
├── /ai/consultants             → кнопка Evidence AI
├── /tools/refs/guidelines      → каталог КР (корпус для RAG)
└── /tools/refs/evidence        → SonoEvidence → ссылка на Assistant

Evidence Assistant (/tools/refs/evidence-assistant)
├── idle          — режимы AI / Unified + корпус КР/НПА
├── success       — ответ + сила доказательств + Копировать
├── empty         — честный empty-state без выдумки
├── search        — Unified search + карточка с разделом/цитатой
├── citations     — раздел + quote + история
└── light theme   — тот же idle в светлой теме
```

## Файлы

| # | Файл | Что показывает |
|---|---|---|
| 01 | `01-entry-library-hub.png` | Библиотека / учебные материалы |
| 02 | `02-evidence-idle-corpus-modes.png` | Idle: корпус + чипы вопросов |
| 03 | `03-evidence-success-answer.png` | Успешный ответ O-RADS |
| 04 | `04-evidence-empty-state.png` | Empty-state «не найдено» |
| 05 | `05-evidence-unified-search-results.png` | Unified search + раздел |
| 06 | `06-evidence-citations-section-quote.png` | Цитата + история |
| 07 | `07-entry-consultants-hub.png` | Хаб помощников |
| 08 | `08-entry-guidelines-catalog.png` | Каталог КР и приказы |
| 09 | `09-entry-sonoevidence.png` | SonoEvidence + переход |
| 10 | `10-evidence-idle-light.png` | Idle · light theme |

## Dev demo states

Только в `development`:

- `?demo=idle`
- `?demo=success`
- `?demo=empty`
- `?demo=search`
- `?demo=loading`
