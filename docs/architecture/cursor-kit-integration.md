# Интеграция sonogyn-cursor-kit (мягкая)

**Дата:** 2026-11-05  
**Источник:** `~/Downloads/files (2)/sonogyn-cursor-kit.zip`  
**Режим:** не ломая основу — углубление платформы

## Что добавлено

| Артефакт | Роль |
|----------|------|
| `.cursor/rules/safety.mdc` | Safety net рядом с architect / MCP / ai-style |
| `docs/prompts/00–07` + `README.md` | Поэтапные промты, адаптированные под Vercel+Supabase+Expo |
| Этот файл | Памятка, чтобы не копировать kit «поверх» второй раз |

## Что сознательно НЕ сделали

- Не перезаписывали `sonogyn_architect.mdc`, `mcp-safety.mdc`, `ai-style.mdc`
- Не вводили Docker Compose как обязательный прод-путь (этап 6 = Vercel-first)
- Не возвращали `/tools/repos` как витрину кода («Исслед. AI» = помощник)

## Закрытие дыр инвентаря (2026-11-05)

- `docs/BACKUP.md`, `docs/RELEASE_CHECKLIST.md`, `docs/LICENSES.md`
- Каркас PELVIS_3D: флаг `NEXT_PUBLIC_PELVIS_3D`, маршрут `/tools/mapping/pelvis`

## Как углублять дальше

1. Запустить этап `00-audit` → `PLATFORM_SNAPSHOT.md` + `ROADMAP_DEEPEN.md`
2. Идти `01`…`07` по одному, с «ок» между этапами
3. При расползании: «Откати всё, кроме файлов из плана»

См. также: `docs/prompts/README.md`.
