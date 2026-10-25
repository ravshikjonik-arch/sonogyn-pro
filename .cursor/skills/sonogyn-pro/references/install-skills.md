# Как установить skills для Cursor Agent

## Где агент их ищет

| Путь | Область |
|------|---------|
| `.cursor/skills/<имя>/SKILL.md` | Этот репозиторий (в git) |
| `~/.cursor/skills/<имя>/SKILL.md` | Все проекты на Mac |
| `~/.agents/skills/` | То же (часто CLI кладёт сюда) |

Встроенные Cursor: `~/.cursor/skills-cursor/` — **не трогать**.

Документация: https://cursor.com/docs/skills

## Способ 1 — через CLI (с GitHub)

```bash
cd /path/to/sonogyn-pro   # project scope
npx skills add owner/repo/path-to-skill --agent cursor

cd ~                      # personal scope
npx skills add owner/repo/path-to-skill --agent cursor
```

Каталог: https://www.getclaudeskills.com/platforms/cursor

## Способ 2 — zip или git clone

```bash
# Личный skill
mkdir -p ~/.cursor/skills/my-skill
# Положить SKILL.md сразу в my-skill/, не во вложенную лишнюю папку

# Проектный skill
mkdir -p .cursor/skills/my-skill
```

После установки: **новый Agent-чат** или перезапуск Cursor. Список: **Customize → Skills**.

## Способ 3 — попросить агента

Прислать zip или путь к папке и написать:

«Установи skill **лично**» → `~/.cursor/skills/`  
«Установи skill **в проект**» → `.cursor/skills/`

## Вызов в чате

- `/sonogyn-pro` или имя skill в списке `/`
- Или фраза: «используй skill frontend-design»

## Cloud Agents

Settings → Agents → **Sync Skills for Cloud Agents** — синхронизирует только `~/.cursor/skills/`.  
Project skills из `.cursor/skills/` попадают в Cloud через **git clone репозитория**.
