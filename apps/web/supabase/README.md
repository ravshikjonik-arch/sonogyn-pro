# Миграции Supabase · SonoGyn Pro

## Быстрая проверка чата врачей

### Способ 1 — SQL Editor (без пароля БД)

```bash
cd apps/web
npm run db:bundle
```

- Уже есть база cases/profiles → **`BUNDLE_COMMUNITY_CHAT_ONLY.sql`** (3 файла, только чат).
- Новый проект → **`BUNDLE_FOR_SQL_EDITOR.sql`** (все 9 миграций).

Supabase Dashboard → **SQL** → вставить → **Run**.

### Способ 2 — автоматически (если есть connection string)

1. В `.env.local` добавьте `SUPABASE_DB_URL=postgresql://...` (Dashboard → Settings → Database).
2. `npm install pg --save-dev`
3. `npm run db:migrate`

## Файлы миграций (по порядку)

| Файл | Назначение |
|------|------------|
| `20260207180000_clinical_cases.sql` | Legacy clinical cases |
| `20260207190000_calculator_entries.sql` | Калькуляторы |
| `20260208100000_saas_platform_core.sql` | profiles, cases, case_media, RLS |
| `20260210120000_teaching_social_on_cases.sql` | Комментарии, лайки, закладки |
| `20260506000000_clinical_copilot_schema.sql` | AI workspace, ultrasound-media |
| `20260506200000_medical_users_avatar_storage.sql` | Аватары врачей |
| `20260605120000_teaching_case_media_storage.sql` | Bucket снимков кейсов |
| `20260605130000_doctor_chat.sql` | Каналы чата + сообщения + медиа в тредах |
| `20260605140000_community_realtime.sql` | Realtime для cases, comments, chat |
| `20260605200000_doctor_presence.sql` | Online roster |
| `20260608120000_security_hardening.sql` | **RLS: copilot series/images, profiles RPC, chat media** |

## После применения

1. `/cases` → вкладка **Чат врачей** → напишите в «Общий чат».
2. Прикрепите фото УЗИ (кнопка камеры у поля ввода).
3. Вкладка **Кейсы УЗИ** → «Демо-кейс» или новый кейс.

**Без PHI** — только обезличенные учебные материалы.
