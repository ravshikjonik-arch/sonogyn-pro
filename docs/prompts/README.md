# Промты углубления платформы (Cursor kit, адаптировано)

Источник: `sonogyn-cursor-kit` (Downloads). В репозиторий встроены **мягко**: не заменяют `.cursor/rules/*` и не требуют Docker-VPS вместо Vercel.

## Как пользоваться

1. Правила уже активны: `safety.mdc` + architect / MCP / ai-style.
2. Копируйте **один** промт (`00` → `07`) в чат Cursor за раз.
3. После этапа: smoke на сайте → commit/PR по запросу → только потом следующий.
4. Если агент «улучшает лишнее»:  
   `Откати всё, кроме файлов из плана. Правило 1 / safety.mdc.`

## Карта этапов ↔ реальность SonoGyn

| Этап | Файл | Фокус сейчас | Уже есть (не ломать) |
|------|------|--------------|----------------------|
| 0 | `00-audit.md` | Сводка в `docs/architecture/` | `master_architecture.md`, ADR, security audit |
| 1 | `01-safety-net.md` | CI/health/**backup** | `/api/health`, CI, **`docs/BACKUP.md`** |
| 2 | `02-copyright.md` | Дочистка контента | ветка `copyright-cleanup`, gate |
| 3 | `03-chat.md` | Стабильность чата | `/cases`, DoctorChannelChat |
| 4 | `04-ai-evidence.md` | Evidence + помощник | `/ai/consultants`, Evidence, «Исслед. AI» |
| 5 | `05-3d-ultrasound.md` | Таз за флагом | **`NEXT_PUBLIC_PELVIS_3D`** → `/tools/mapping/pelvis` (чеклист); 3D-модель — позже |
| 6 | `06-release.md` | Релиз Vercel+Supabase | **`docs/RELEASE_CHECKLIST.md`**, `LAUNCH_CHECKLIST.md` |
| 7 | `07-mobile.md` | PWA + parity с Expo | `apps/mobile`, web PWA |

Золотое правило: **углублять существующие модули**, не параллельные «вторые платформы».
