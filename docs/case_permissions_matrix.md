# Матрица прав — обсуждения кейсов

Роли вычисляются **на сервере** (`discussion-permissions.ts`) и дублируются в **RLS/RPC**.

| Действие | author | participant | verified_doctor | expert | moderator | admin |
|----------|:------:|:-----------:|:---------------:|:------:|:---------:|:-----:|
| Читать комнату (API) | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ |
| Писать комментарий | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ |
| Ответ (1 уровень) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Реакции | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Подписка на кейс | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Resolve кейса | ✓ | — | — | — | ✓ | ✓ |
| Confirm + диагноз | — | — | ✓† | ✓ | ✓ | ✓ |
| Archive | — | — | — | — | ✓ | ✓ |
| Reopen | ✓ | — | — | — | ✓ | ✓ |
| Publish → база знаний | — | — | — | — | ✓ | ✓ |
| Mark best answer | ✓ | — | — | — | — | — |
| Pin expert answer | — | — | ✓† | ✓ | ✓ | ✓ |
| Hide comment (moderation) | — | — | — | — | ✓ | ✓ |
| Report comment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Редактировать чужой кейс | — | — | — | — | — | — |
| Менять confirmed_diagnosis без права | — | — | — | — | ✓ | ✓ |

\* Требуется `has_doctor_community_access()` + `can_access_case_discussion(case_id)`  
† `verified_doctor` с `medical_verified_at IS NOT NULL` → `is_case_expert()`

## Запреты (enforced)

| Запрет | Enforcement |
|--------|-------------|
| Редактировать чужой кейс | RLS `cases` UPDATE только owner/admin |
| Менять диагноз без права | RPC `transition_case_lifecycle` + `is_case_expert` |
| Публиковать не проверенные изображения | Gate R6 + `anonymization_status` на publish |
| Подписка на приватный канал без доступа | RLS `channel_subscriptions` + medical gate |
| Client-side role only | UI скрывает кнопки; RPC/RLS — источник истины |
| PHI в обсуждении | rate limit + moderation reports + safeLog без PHI |

## Прямой Supabase client

- **Канонический read path:** `GET /api/cases/[caseId]/comments`
- RLS на `teaching_case_comments` ограничивает SELECT участниками с medical access
- Realtime использует те же RLS-политики (не global subscription)
