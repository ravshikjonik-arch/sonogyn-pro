# Executive Summary — Master Audit SonoGyn Pro

**Дата аудита:** 2026-10-17  
**Репозиторий:** `ultrasound-saas-monorepo` / GitHub `ravshikjonik-arch/sonogyn-pro`  
**Ветка локально:** `main` (после merge PR #52, Android `versionCode` 7)  
**Production web (из документации):** https://sonogyn-pro-web-ravshan-s-projects3.vercel.app  
**Режим аудита:** read-only; бизнес-код и БД не изменялись.

---

## Краткий вердикт

SonoGyn Pro — **крупный зрелый monorepo** с сильным ядром клинических калькуляторов, teaching cases, structured editor и **многослойным web-стеком** (Next.js 16, ~199 страниц, ~165 API routes). Целевая навигация **Лента · Кейсы · AI · Инструменты · Профиль** зафиксирована в SSOT (`packages/clinical-tools/src/primary-nav.ts`) и реализована на mobile (5 tabs); на web — частично через `(clinical)` + legacy маршруты.

**Production readiness:** для **web-клинической платформы** — близко к beta/production при условии контроля миграций и EMR-scope; для **mobile** — **Android preview APK** собирается; **iOS device internal** заблокирован credentials; **parity web ≫ mobile** по кейсам, evidence, education, admin.

**CI на `main`:** job `CI` — **success** (commits `38741780305`, `38743175038`); workflow `.github/workflows/us-ai-worker.yml` — **failure за 0s** на каждый push (отдельная инфра-проблема, не блокирует основной CI).

---

## Статусы по зонам (обобщение)

| Зона | Статус | Комментарий |
|------|--------|-------------|
| Monorepo / shared packages | IMPLEMENTED_UNVERIFIED | 37+ packages; дубли TI-RADS/BI-RADS; drift миграций |
| Web UI & routes | IMPLEMENTED_UNVERIFIED | Очень широкий охват; часть legacy/duplicate paths |
| Auth & security hardening | PARTIAL → VERIFIED (tests) | `test:security` 110/110 локально; RLS — см. отдельный doc |
| Teaching cases & lifecycle | IMPLEMENTED_UNVERIFIED | RPC + API + tests; prod verify script ✅ (сессия до аудита) |
| AI chat (Sonogyn) | IMPLEMENTED_UNVERIFIED | OpenRouter/AI SDK, evidence mode, guards; не полноценный vector RAG |
| Medical knowledge / evidence | PARTIAL | `@repo/evidence-retrieval`, corpus, guidelines sync; единый trace до PDF — не везде |
| Calculators | VERIFIED (sample) | `@repo/orads-us` 42/42 tests; каталог в `clinical-tools` |
| Mobile app | PARTIAL | 5 tabs; prod API в EAS preview; orphan screens; typecheck ломается на `yakrav7700/` |
| EMR / patients (web) | IMPLEMENTED_UNVERIFIED | Полноценные API `/api/patients`, studies — продуктовое расхождение с «только teaching» |
| Video (Remotion) | MISSING / BLOCKED | Скрипты в root `package.json`, пакета `@repo/video` в workspace **не найден** |
| Local dev quality | BROKEN (partial) | `pnpm typecheck` локально без `prisma generate`; `@repo/ui` — `react 2` types |

---

## Топ-риски (подтверждённые)

1. **P0 — Drift миграций** (`apps/web/supabase/migrations` **60** файлов vs `packages/database/supabase/migrations` **45**). Риск расхождения staging/prod и документации.
2. **P0 — Scope PHI:** coexistence **EMR patient flows** и **teaching cases**; нужна явная продуктовая и RBAC-граница (код есть в обоих направлениях).
3. **P1 — AI «RAG»:** доменный snippet + unified evidence search — **не** гарантия верifiable citation для каждого ответа; `insufficient evidence` path есть в коде.
4. **P1 — Mobile parity:** structured case editor, evidence assistant, lifecycle UI — преимущественно web.
5. **P2 — Monorepo hygiene:** `apps/mobile/yakrav7700/` ломает mobile typecheck; EAS archive ~483 MB (`.easignore` не оптимизирован).
6. **P2 — Дубли пакетов:** `tirads-acr` vs `thyroid-tirads`, `birads-us` vs `breast-classification`.

---

## Что уже хорошо (сохранять)

- SSOT primary nav и catalog clinical tools (`packages/clinical-tools`).
- Hardening AI chat: Zod schema, rate limit, PHI block, prompt injection, session persistence (`apps/web/app/api/ai/chat/route.ts`).
- Case lifecycle state machine + unit tests (`lib/cases/__tests__/lifecycle-transitions.test.ts`).
- Upload magic bytes shared package; security unit suite в CI.
- O-RADS US package с обширными тестами.

---

## Рекомендуемый порядок (см. `08-prioritized-roadmap.md`)

1. Синхронизация migration trees + staging apply checklist.  
2. Продуктовая граница EMR vs teaching + аудит RLS на patient tables.  
3. Evidence pipeline: обязательные citations в UI + тестовые сценarios без PHI.  
4. Mobile: убрать/исключить `yakrav7700` из tsc; iOS credentials; parity backlog.  
5. Удаление/консолидация duplicate RADS packages (после regression tests).

---

## Ограничения этого summary

Детали, доказательства и reестр функций — в файлах `01`–`09`. Полный e2e и production build **не перезапускались** в финальной фазе аудита (опираемся на CI green + выборочные локальные тесты).
