# UX, Navigation, Web vs Mobile

**Дата:** 2026-10-17  
**Note:** UI не менялся; оценка по коду, IA и parity matrix.

---

## 1. Information architecture (target)

SSOT: **Лента · Кейсы · AI · Инструменты · Профиль** (`packages/clinical-tools/src/primary-nav.ts`).

| Tab | Web href | Mobile tab |
|-----|----------|------------|
| Лента | `/feed` (+ `/app`, `/home` aliases) | FeedTab |
| Кейсы | `/cases` | CasesTab |
| AI | `/ai/consultants` | AiTab |
| Инструменты | `/tools/calc` | ToolsTab |
| Профиль | `/profile` | ProfileTab |

**Status:** VERIFIED for definition; **PARTIAL** for legacy URL cleanup on web.

---

## 2. Web UX observations (code-based)

| Topic | Finding | Severity |
|-------|---------|----------|
| Route duplication | `/calculators/*` vs `/tools/calc/*` | P2 |
| Legacy assistant | `(clinical)/assistant/*` vs `/ai/*` | P2 |
| Library vs tools refs | Parallel content trees under `/library` and `/tools/refs` | P2 |
| EMR depth | Patients, workspace, copilot — heavy flows | Product P1 |
| Doctor start / command center | PR #52 added `DoctorStartPanel` | IMPLEMENTED_UNVERIFIED |
| Dark/light | design tokens / a11y rules in `.cursor/rules` | IMPLEMENTED_UNVERIFIED |
| Bottom nav | Clinical shell on web | IMPLEMENTED_UNVERIFIED |

**Dead controls:** not exhaustively clicked in browser during audit — **BLOCKED** for full UI_ONLY scan without Playwright crawl. Recommend scripted link checker.

---

## 3. Mobile UX (Expo)

| Topic | Status | Evidence |
|-------|--------|----------|
| 5-tab shell | IMPLEMENTED_UNVERIFIED | `MainTabs.tsx` |
| Orphan screens | PARTIAL | `KnowledgeScreen`, `CommunityHubScreen`, `LibraryScreen`, `CalculatorsScreen` |
| Prod API in preview | IMPLEMENTED_UNVERIFIED | `eas.json` preview profile |
| Keyboard / safe area | — | not audited visually |
| Offline | partial patterns | expo skills scope — not verified |
| Deep links | LEGACY aliases in primary-nav | migration notes |

---

## 4. Parity table

| Scenario | Web | Mobile | Gap |
|----------|-----|--------|-----|
| Open AI & ask | ✅ routes | ✅ tab | Mobile may lack evidence UI |
| O-RADS calc | ✅ | ✅ | — |
| Teaching case detail | ✅ | ✅ | Structured edit web-only |
| Case lifecycle | ✅ panel | — | **P1** |
| Evidence assistant | ✅ | — | **P1** |
| Unified search | ✅ PR #52 | — | **P2** |
| Courses / library | ✅ | — | **P3** |
| EMR patient card | ✅ | — | intentional? |
| Feed | ✅ | ✅ | content parity unknown |

---

## 5. Time-to-task (qualitative, code IA)

| Task | Web path depth | Mobile path depth |
|------|----------------|-------------------|
| AI | 1 tab | 1 tab |
| O-RADS | 2+ (tools/calc) | stack from Tools |
| Case | 1 tab | 1 tab |
| Calculator discoverability | high (large catalog) | medium (Tools stack) |
| Classification ref | library/refs | limited |

---

## 6. Accessibility

- E2E: `test:e2e:a11y` soft in CI.
- Rules: keyboard focus, aria-labels — `.cursor/rules/a11y-dark-light.mdc`.
- **Strict mode not enabled in CI** (by design).

---

## 7. Mobile build / distribute UX

| Platform | Status | User impact |
|----------|--------|-------------|
| Android APK v7 | VERIFIED (EAS artifact session) | Install via Expo link |
| iOS device | BLOCKED | Needs registered devices + interactive EAS |
| iOS simulator tarball | VERIFIED built | Dev only |
| Archive size ~483 MB | P2 | Slow uploads — `.easignore` |

---

## 8. iOS version mismatch note

- `app.json` buildNumber **7** vs possible `Info.plist` CFBundleVersion **5** (from prior session) — **P2** align before App Store / ad hoc.

---

## 9. UX priorities

| Pri | Item |
|-----|------|
| P1 | Mobile case lifecycle read-only + web parity spec |
| P2 | Remove or wire orphan mobile screens |
| P2 | Canonical URLs + redirects for calculators |
| P3 | Premium visual pass on feed (no redesign in audit) |
