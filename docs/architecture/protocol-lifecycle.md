# Жизненный цикл протокола УЗИ

## Текущее состояние (2026-09-10)

Structured protocol draft **реализует lifecycle** (migration `20260910190000`):

| Статус | UI | Редактирование |
|--------|-----|----------------|
| `draft` | Черновик | ✅ автор |
| `review` | На проверке | ✅ автор |
| `finalized` | Финализирован | ❌ trigger guard |
| `amended` | (версия в history) | — |
| `archived` | Архив | ❌ |

**API:** `PATCH /api/studies/{studyId}/protocol/structured-draft/lifecycle`

**Actions:** `submit_review`, `finalize`, `amend`, `archive`

**Integrity:** SHA-256 `content_hash` (`protocol-content-hash.ts`) — не КЭП.

Параллельные потоки (не удалять):

| Поток | Файлы |
|-------|-------|
| Legacy form | `UltrasoundProtocolForm.tsx` |
| Structured draft | `protocol-structured-service.ts`, `StructuredProtocolDraftPanel.tsx` |
| SRE | `structured-reports-service.ts` |

## Целевая модель (полная)

| Enum | UI (RU) | Правила |
|------|---------|---------|
| `DRAFT` | Черновик | Редактирует автор |
| `REVIEW` | На проверке | Автор + рецензент |
| `FINALIZED` | Финализирован | Immutable content |
| `AMENDED` | Исправленная версия | Новая version chain |
| `ARCHIVED` | Архив | Read-only, не удаляется |

### Версионирование (planned)

- `version_number`, `previous_version_id`
- `finalized_at`, `finalized_by`
- `amendment_reason`
- `content_hash` — SHA-256 canonical JSON (integrity check, **не** КЭП)

### PDF

Экспорт финализированного протокола привязан к `version_number` через `protocol-to-pdf-spec.ts`.

## Gap analysis

| Требование | Статус |
|------------|--------|
| Version snapshots | ✅ structured draft |
| Finalize lock | ❌ |
| Amend creates new version | ❌ |
| content_hash | ❌ |
| Export audit (protocol) | ❌ (case export ✅) |
| UI «Финализировать протокол» | ❌ |

## Следующий этап

1. Migration: add `lifecycle_status`, `content_hash` to `protocol_structured_drafts`
2. RPC `finalize_protocol_draft` / `amend_protocol_draft`
3. RLS: deny UPDATE on FINALIZED rows except via amend RPC
4. Tests + UI confirmation dialog

## Терминология

Использовать **«Финализировать протокол»** / **«Подтвердить завершение документа»** — не «электронная подпись», если нет интеграции с аккредитованным оператором ЭП.
