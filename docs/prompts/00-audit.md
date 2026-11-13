# Этап 0. Аудит (код НЕ менять)

Скопируйте в Cursor:

```
Роль: Principal Architect SonoGyn Pro. Только анализ, код НЕ менять.

Опирайся на уже существующее (не дублируй с нуля):
- docs/architecture/master_architecture.md, platform_first_architecture.md, README.md
- docs/architecture/adr/*, clinical-platform-audit.md
- docs/security/*, AGENTS.md, CLAUDE.md, about-me.md
- apps/web, apps/mobile, packages/medical-calculations, packages/clinical-tools

Собери/обнови ОДИН сводный файл docs/architecture/PLATFORM_SNAPSHOT.md:
1. Стек, монорепо, входные точки, деплой (Vercel web + Expo + Supabase).
2. Работающие функции врача: калькуляторы (O-RADS/BI-RADS/TI-RADS/IOTA…), пациенты, протоколы,
   Исслед. AI → /ai/consultants, Evidence, чат /cases, AI-зона снимков, обучение.
3. Схема данных и внешние сервисы (без дампа PHI); где снимки/файлы.
4. Хрупкое: дубли, пробелы тестов, copyright-риски (пути), perf.
5. Пробелы до «уверенного релиза»: мониторинг, бэкапы, политика данных, mobile parity.
6. Порядок углубления: от низкого риска к высокому; откат на каждый шаг.

Также короткий docs/architecture/ROADMAP_DEEPEN.md (ссылки на docs/prompts/01–07).
Покажи оба файла и жди подтверждения. Не создавай второй ARCHITECTURE.md в корне, если snapshot покрывает.
```
