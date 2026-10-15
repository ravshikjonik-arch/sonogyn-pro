# Жизненный цикл клинического кейса

> Краткая версия: [`docs/case_lifecycle.md`](../case_lifecycle.md)  
> Аудит платформы: [`clinical-platform-audit.md`](./clinical-platform-audit.md)

## Канонические статусы

| Enum (DB) | UI (RU) |
|-----------|---------|
| `open` | Открыт |
| `discussion` | Обсуждение |
| `resolved` | Решён |
| `confirmed` | Диагноз подтверждён |
| `archived` | Архив |

## Допустимые переходы

```
OPEN → DISCUSSION (авто: первый комментарий)
OPEN → RESOLVED
DISCUSSION → RESOLVED
RESOLVED → DISCUSSION (reopen)
RESOLVED → CONFIRMED
CONFIRMED → ARCHIVED
ARCHIVED → DISCUSSION (reopen)
CONFIRMED → publish_knowledge_base (metadata only)
```

Все остальные переходы **отклоняются** RPC `transition_case_lifecycle`.

## Подтверждение диагноза (CONFIRMED)

Обязательные поля:

- `confirmationMethod` — тип верификации
- `confirmedDiagnosis` — содержательное заключение (≥ 3 символов)
- `confirmationMethodOther` — если method = `other`

Методы: `histology`, `surgery`, `mri`, `ct`, `genetics`, `laboratory`, `clinical_follow_up`, `dynamic_observation`, `expert_consilium`, `other`.

## API

| Method | Path | Описание |
|--------|------|----------|
| PATCH | `/api/cases/{caseId}/lifecycle` | Переход (`action` + confirm fields) |
| GET | `/api/cases/{caseId}/lifecycle/history` | Timeline (40 events) |

Headers:

- `X-Request-Id` — correlation ID (echo в ответе)
- `Idempotency-Key` — защита от дублирования критических команд

## Service layer

- `apps/web/lib/cases/lifecycle-service.ts` — валидация + RPC wrapper
- `apps/web/lib/cases/discussion-permissions.ts` — UI/RBAC matrix
- State machine source of truth: `packages/types/src/case-discussions.ts`

## Audit

| Таблица | Содержимое |
|---------|------------|
| `case_lifecycle_events` | from/to, actor, reason, request_id, idempotency_key |
| `clinical_platform_audit_events` | action codes без тел документов |

## Защита от прямого UPDATE

Trigger `trg_guard_direct_case_lifecycle` — `lifecycle_status` меняется только через RPC (session flag `app.lifecycle_transition`).

## Миграции

1. `20260701120000_case_lifecycle_ia_v2.sql` — колонки lifecycle
2. `20260830170000_case_discussions_v3.sql` — state machine + audit
3. `20260910180000_case_lifecycle_hardening.sql` — guard, idempotency, unified audit

**Применять на staging перед production.**
