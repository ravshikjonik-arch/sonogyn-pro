# Жизненный цикл клинического кейса (Case Discussions v3)

## Статусы

```
OPEN → DISCUSSION → RESOLVED → CONFIRMED → ARCHIVED
         ↑              ↓           ↓
         └──── reopen ──┴───────────┘
```

| Статус | Значение |
|--------|----------|
| **OPEN** | Кейс создан, обсуждение ещё не началось |
| **DISCUSSION** | Есть комментарии (авто-триггер на первый комментарий) |
| **RESOLVED** | Автор закрыл вопрос; ждёт экспертного подтверждения |
| **CONFIRMED** | Эксперт подтвердил диагноз с указанием метода верификации |
| **ARCHIVED** | Модератор архивировал (не активен в ленте) |

## Методы подтверждения (CONFIRMED)

- `histology` — гистология
- `surgery` — операция
- `mri` — МРТ
- `ct` — КТ
- `genetics` — генетика
- `dynamic_observation` — динамическое наблюдение
- `expert_consilium` — экспертный консилиум
- `other` — другое (**обязательно** `confirmation_method_other`)

## Переходы (RPC `transition_case_lifecycle`)

| Action | Кто | Из статусов |
|--------|-----|-------------|
| `resolve` | автор / модератор | open, discussion |
| `confirm` | эксперт (`is_case_expert`) | resolved, discussion |
| `archive` | модератор / admin | любой кроме terminal guard |
| `reopen` | автор / модератор | resolved, archived |
| `publish_knowledge_base` | модератор / admin | confirmed |

## База знаний

При `publish_knowledge_base`:
- `knowledge_base_at = now()`
- `channel_id = NULL` (перевод в библиотеку)
- `status = published`, `is_public = true`

## Аудит

Таблица `case_lifecycle_events` — каждый переход с `from_status`, `to_status`, `actor_id`, `meta`.

## API

- `PATCH /api/cases/[caseId]/lifecycle` — переход статуса
- `GET /api/cases/[caseId]/lifecycle/history` — история

## Миграция

`20260830170000_case_discussions_v3.sql` — **не применять на production без staging smoke**.
