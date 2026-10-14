# Primary navigation — Web · iOS · Android

**SSOT:** `packages/clinical-tools/src/primary-nav.ts`  
**Web UI:** `apps/web/lib/nav/clinical-primary-nav.ts` + `ClinicalBottomNav.tsx`  
**Mobile UI:** `apps/mobile/src/navigation/MainTabs.tsx`

## Пять вкладок (одинаковый порядок)

| # | ID | RU | Web href | Mobile screen |
|---|-----|-----|----------|---------------|
| 1 | `feed` | Лента | `/feed` (+ `/app` подсветка) | `FeedTab` → `HomeScreen` |
| 2 | `cases` | Кейсы | `/cases` | `CasesTab` → `CasesScreen` (PHI gate) |
| 3 | `ai` | AI | `/ai/consultants` | `AiTab` → `AssistantHubScreen` |
| 4 | `tools` | Инструменты | `/tools/calc` | `ToolsTab` → `ToolsScreen` |
| 5 | `profile` | Профиль | `/profile` | `ProfileTab` → `ProfileScreen` |

## Mobile: без 6-й вкладки «Справочник»

Справочник (КР, нозологии, evidence) — **подпанель** `ToolsTab`:

- `panel: "calculators"` — калькуляторы (default)
- `panel: "reference"` — `ReferenceHubPanel`
- `referenceSection: "guidelines"` — КР внутри Tools

Deep links из каталога: `openClinicalTool.ts` → `CasesTab` / `ToolsTab` params.

## Legacy (не использовать в новом коде)

| Старое | Новое |
|--------|--------|
| `ChatTab` | `CasesTab` |
| `AssistantTab` | `AiTab` |
| `KnowledgeTab` | `ToolsTab` + `panel: "reference"` |

## Дубликаты репозитория

Канонический mobile: **`apps/mobile`**.  
Папка `products/sonogyn-pro/app` — **не** в `pnpm-workspace.yaml`; не синхронизировать без явного запроса.

## Unified search (P0-2)

| Платформа | Entry | SSOT |
|-----------|--------|------|
| Web ⌘K | `GlobalSearchDialog` | `apps/web/lib/search/global-search.ts` |
| Mobile | `ClinicalToolSearchBar` | `apps/mobile/src/lib/search/unifiedClinicalSearch.ts` |
| Modules | `searchModules` / `searchEducationModules` | `packages/clinical-tools/src/module-search.ts` |

КР и нозологии на web — `@repo/clinical-guidelines`, `@repo/nosology/seed` (без второй копии JSON в apps).

## Quiz hub (P1-3)

| | |
|--|--|
| SSOT | `apps/web/lib/education/quiz-hub-registry.ts` |
| Web | `/tools/refs/quiz-hub` |
| Mobile | Справочник → «Клинические задачи» (in-app browser) |
| Module id | `education.quiz-hub` в `modules.catalog.ts` |

## Knowledge graph (P1-2 / P1-4)

| | |
|--|--|
| Code SSOT | `packages/clinical-tools/src/knowledge-links.ts` (fallback) |
| DB | `public.knowledge_links` + `meta` jsonb; seed `20261014120000_knowledge_graph_teaching_cases.sql` |
| API | `GET /api/knowledge/links?fromType=nosology&fromId=` — merge DB + code |
| Publish кейса | `publish_knowledge_base` → trigger + RPC `sync_teaching_case_knowledge_links` |
| Лента кейсов | `GET /api/cases?knowledgeBase=1` · фильтр «База знаний» в `CaseFeed` |
| UI | `KnowledgeLinksCard` · нозология + опубликованный кейс · блок в Case Library |
| Types | `packages/types/src/knowledge-graph.ts` |

## EAS / store builds

Сборки iOS/Android берут `apps/mobile` (committed `ios/` + `android/` на main).  
После смены табов — smoke: 5 вкладок, PHI gate только на Cases, справочник из Tools.
