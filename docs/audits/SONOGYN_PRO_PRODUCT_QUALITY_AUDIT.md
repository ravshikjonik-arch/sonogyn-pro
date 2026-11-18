# SonoGyn Pro — Forensic Product Quality & AI-Generated Artifact Audit

| Field | Value |
|---|---|
| **Audit date** | 2026-11-18 |
| **Scope** | Production `https://sonogyn-pro.ru` + monorepo `apps/web`, `packages/*` |
| **Mode** | Research / documentation only — **no code, design, DB, env, commit, or deploy changes** |
| **Methods** | Browser MCP + Playwright (desktop/mobile viewport), HTTP smoke, repository search, visual screenshots |
| **Not run in this pass** | Fresh Lighthouse CI, full `pnpm typecheck`/`lint` suite, WCAG axe strict, RLS penetration, authenticated profile deep-dive, App Store builds |

---

## A. Executive Summary

SonoGyn Pro — **двойственный продукт**.

**Сильная сторона:** клиническое ядро (O-RADS / BI-RADS / TI-RADS / IOTA / акушерские и гинекологические калькуляторы, Неотложка KB, CDS-дисклеймеры) выглядит как работа практикующего врача-фаундера, а не как пустой AI-демо. Это редкость для «нейросетевых» SaaS-лендингов.

**Слабая сторона:** оболочка продукта (маркетинг, IA сайдбара, баннеры пилота, light/dark контраст, дубли файлов, маркетинговый язык) местами выглядит как **сборка из шаблонных SaaS/AI-паттернов** и незавершённого пилота до 27.12.2026.

| Dimension | Score (1–10) | Comment |
|---|---:|---|
| Clinical substance (calculators / CDS) | **8.0** | Depth above typical AI MVP |
| Visual brand discipline | **5.5** | Strong purple/cosmic identity, but glow/glass/pill overuse |
| Product packaging / trust | **5.0** | Triple banners, “тест/черновик”, launch date everywhere |
| Information architecture | **5.5** | Dense sidebar, duplicate nav items, guest vs doctor confusion |
| Content / tone for physicians | **6.0** | Mix of precise CDS + marketing clichés (“вселенная”, “умный анализ”) |
| Codebase hygiene | **4.5** | Hundreds of `* 2.*` duplicate files; dead heroes; unfinished TODOs |
| Accessibility (observed) | **5.0** | Skip links present; light-mode contrast failure on `/cases` |
| **Overall maturity as premium medical SaaS** | **6.0** | Ready as clinical toolkit; not yet as premium product shell |

**Verdict in one line:** клинический инструмент уже убедителен; продуктовая «упаковка» и визуальная дисциплина пока не дотягивают до международного премиум-уровня Healthcare SaaS.

---

## B. AI-generated Design Signals

| ID | Signal | Where observed | Evidence | Severity |
|---|---|---|---|---|
| DS-01 | Purple glow / “neon” shadows | Landing hero | `LandingMarketingHero.tsx`: `shadow-[0_0_28px_rgba(168,85,247,0.45)]`, multiple `0_0_*` glows | High |
| DS-02 | Glassmorphism overuse | Landing, auth, tools | `.sonogyn-glass-card`, `backdrop-blur-xl` + black/45 panels | Medium |
| DS-03 | Pill / chip clusters | Landing TOP_PILLS, feed badges, cases “Live Realtime” | Screenshot landing + feed; `TOP_PILLS` in hero | Medium |
| DS-04 | Template SaaS hero composition | `/` | Brand + glass panel + feature list + CTA + art plane — classic AI landing recipe | High |
| DS-05 | Decorative stat strip | Landing STATS | `30+`, `24/7`, `Тест` — vanity metrics, one is “Тест” | High |
| DS-06 | Uniform card grids | `/tools`, hubs, calculators catalog | `ClinicalDomainHub` card lists — same structure repeated | Medium |
| DS-07 | Sparkles / AI iconography as default “premium” | Landing FEATURES, bottom nav AI | Lucide `Sparkles` as AI signal | Low–Medium |
| DS-08 | Soft rounded-everything | Global | Widespread `rounded-2xl` / `rounded-3xl` / `rounded-full` without role differentiation | Medium |
| DS-09 | Stacked system banners | Clinical shell | Launch orange + green “Тестовый режим” (+ safety copy) compresses content | Critical (trust) |
| DS-10 | Brand concept vs clinical chrome mismatch | Landing dark cosmic vs `/cases` light low-contrast | Screenshots 2026-11-18 | High |
| DS-11 | Emoji in clinical/product surfaces | Achievements, protocol form | `AchievementBadge` 🔒/🔥; `UltrasoundProtocolForm` 📋 | Medium |
| DS-12 | English microcopy in RU clinical UI | Feed | Literal badge **“Case of the day”**, empty state “editorial” | Medium |
| DS-13 | Marketing cliché language | Landing H1/lead | «Ваша вселенная женского здоровья», «Умный анализ», «24/7» | High |
| DS-14 | Duplicate file artifacts (`* 2.*`) | Repo | **~322** files under `apps/web` + `packages` (excl. node_modules/.next) | Critical (process) |
| DS-15 | Dead / parallel components | Landing | `LandingHero.tsx` unused; `LandingMarketingHero.tsx` used; `LandingPopularCalculators 2.tsx` | Medium |

**Important:** фиолетово-бирюзовая «космическая» эстетика — **авторская концепция бренда**, не баг. Проблема не в цвете, а в **недисциплинированном применении** glow/glass/pill и в разрыве между маркетингом и рабочим кабинетом.

---

## C. UX/UI Audit (by surface)

### C1. Marketing landing `/`

**Observed (browser):** dark cosmic hero, glass CTA card «Сразу в кабинет», H1 «Ваша вселенная женского здоровья», feature list with Sparkles, career ladder, calculator chips, FAQ, heavy legal/disclaimer footers.

**Issues:**
- Hero sells “universe / AI platform” before clinical workflow — weak brand test for *doctor tool* (emotion over task).
- Multiple competing CTAs («Открыть кабинет» × many, «Войти», «PRO»).
- Stat strip includes **«Тест»** as a KPI — signals unfinished product.
- Open-access / launch messaging repeats on landing + global banner.

**Strengths:** Clear physician-only positioning; CDS disclaimer present; calculator deep-links are useful.

### C2. Auth `/login`

**Observed:** glass card, tabs Почта / SMS / Telegram, guest CTA «В кабинет без входа», launch date subtitle.

**Issues:**
- When `isAuthEmailOnlyClient()`, UI exposes concrete mailbox hint `Sonogyn-pro@mail.ru` in subtitle (code: `apps/web/app/login/page.tsx`) — looks like staging credential leakage into product copy.
- Auth visual language (glass) differs from clinical shell tokens.
- Guest path is strong for pilot, but blurs “who is logged in / what is saved”.

### C3. Clinical shell (sidebar + banners)

**Observed:** ~32 nav hrefs; «Live приём · УЗИ» repeated **3 times** (Акушерство / Гинекология / Помощник); profile items show «вход» for guests.

**Issues:**
- Sidebar density exceeds clinical “fast path” expectation — calculator access competes with community/AI/refs.
- Triple banners reduce usable viewport especially on mobile (~390×844).
- Macros «Макеты УЗИ» + Telegram promo in sidebar add noise for daily practice.

**Strengths:** Domain grouping exists; skip-to-content link present; theme toggle present.

### C4. Feed `/feed`

**Observed (mobile screenshot):** dark theme, case-of-day card, bottom tab bar.

**Issues:**
- English badge «Case of the day» / empty «editorial» (`feed/page.tsx`).
- Generic H1 «Для врача УЗД» — not “Лента кейсов”.
- Feed feels thin vs promised “community” — few editorial blocks.

### C5. Cases / chat `/cases`

**Observed (Playwright mobile, light theme):** heading «Чат врачей SonoGyn Pro», pills «Live Realtime», presence chips; **very low contrast** (pale text/controls on white).

**Issues:**
- Light-mode contrast failure (WCAG risk) — Critical for readability.
- Console: `401` on `/api/doctor-presence` for guest — noisy and incomplete guest UX.
- Mixed EN/RU («Live Realtime»).
- Theme inconsistency vs feed (dark) in same session/device.

### C6. Tools `/tools` and calculators

**Observed:** hub cards via shared pattern; RADS calculators (O/BI/TI) functionally rich.

**Issues:**
- Hub pages feel like “link directories”, not clinical workspaces.
- SEO shells show «Черновик · вычитка врача» (`CLINICAL_CONTENT_REVIEW_STATUS_RU`) on production calculator landings — undermines trust.
- Unknown OB slugs historically soft-served catalog (`/tools/calc/ob/crl` titled as catalog) — IA hole.
- O-RADS pregnancy mode (repo) is powerful but historically hidden behind secondary form (discoverability).

**Strengths:** Calculator UIs (BI-RADS lexicon, TI-RADS/EU-TIRADS, O-RADS ACR tree) feel like medical instruments, not generic forms. CDS disclaimers consistent.

### C7. Emergency `/tools/emergency`

**Observed earlier in session:** query «инфаркт» returns structured guide; API retrieve OK.

**Strengths:** High clinical utility; clear “not diagnosis” framing.

**Issues:** Branded as «Тестовый режим» in header — again pilot language on a high-stakes module.

### C8. Pricing `/pricing`

**Observed:** cleaner, calmer light layout; Free until launch card; charity note; store status text.

**Strengths:** More restrained than landing; honest about pre-launch.

**Issues:** Still dominated by launch/PII warnings; PRO value proposition secondary to disclaimers.

### C9. Profile / PRO / patients

**Observed via HTTP:** `/profile*` → 307 login (expected for guest). Deep authenticated UX **not audited** in this pass.

### C10. Mobile

**Observed:** bottom nav 5 items; hamburger + stacked banners; landing hero CTA card dominates first viewport.

**Issues:** Banner stack + bottom nav + sticky footers on calculators shrink content.
**Strengths:** Bottom IA is clearer than desktop sidebar for primary tasks.

---

## D. Code Quality Audit

| ID | Finding | Evidence | Impact |
|---|---|---|---|
| CQ-01 | Massive duplicate files `* 2.*` | ~322 under `apps/web`+`packages` (source trees) | Build confusion, review noise, “AI/macOS copy” smell |
| CQ-02 | Dead landing hero | `LandingHero.tsx` not imported; `LandingMarketingHero` is | Dead code / dual narratives |
| CQ-03 | Duplicate component copies | e.g. `Ambulatory* 2.tsx`, `PelvisDieChecklistClient 2.tsx`, `LandingPopularCalculators 2.tsx` | Drift risk |
| CQ-04 | Unfinished clinical TODOs | `packages/breast-classification` ARFI TODOs; `fmfReferenceData` percentile TODO | Medical accuracy debt |
| CQ-05 | Legal TODOs in user-facing pages | `offer/page.tsx`, privacy cross-border TODO list | Trust / compliance packaging |
| CQ-06 | Hardcoded pilot email in auth copy | `login/page.tsx` `Sonogyn-pro@mail.ru` | Security + professionalism |
| CQ-07 | Token vs hardcoded palette | ~3821 `--clinical-*` vs ~145 raw `violet-/purple-` | Dual design systems (tokens + Tailwind violet) |
| CQ-08 | Shared hub abstraction overused | `ClinicalDomainHub` (~8 usages) | Homogeneous “card wall” UX |
| CQ-09 | Guest API 401 noise | `/api/doctor-presence` 401 on `/cases` | Console pollution; incomplete open-access design |
| CQ-10 | Console usage | Many `console.warn` in services (acceptable); scripts heavy `console.log` | Mostly OK if not shipped to client critically |
| CQ-11 | Coming soon strings in locales | `orads` `share_todo`: «Скоро (Фаза 3)» | Visible unfinished features |
| CQ-12 | IDEA module stubs | `idea-deep-endometriosis` demo patients PX-1001; “заглушка” Enzian mapping | Demo artifacts in product surface |

**Architecture note:** Monorepo separation (`packages/medical-calculations`, `orads-us`, etc.) is a **positive** professional signal — opposite of single-file AI spaghetti. Hygiene of the **web shell** lags the packages.

---

## E. Content Audit

| ID | Text / pattern | Location | Problem | Recommendation |
|---|---|---|---|---|
| CT-01 | «Ваша вселенная женского здоровья» | Landing H1 | Cosmic marketing, not clinical task language | Keep brand art; rewrite H1 toward УЗИ/АГ workflow |
| CT-02 | «Умный анализ и поддержка клинических решений» | Landing feature | Vague AI cliché | Name concrete CDS outputs (протокол, стратификация) |
| CT-03 | «24/7» repeated | Hero pills/stats | Implies SLA not evidenced | Remove or qualify |
| CT-04 | «Без потолка» / «масштабировать практику» | Career / PRO | Startup jargon | Physician-plain: «без лимитов AI/кейсов» |
| CT-05 | «Case of the day» / «editorial» | Feed | Language mix | «Кейс дня» / remove “editorial” |
| CT-06 | «Live Realtime» | Cases | English decorative badge | RU: «Онлайн» or remove |
| CT-07 | «Черновик · вычитка врача» | Calculator SEO shells | Public “draft” stigma | Hide on prod or show “клинически согласовано” when true |
| CT-08 | «Тестовый режим» on Emergency | Emergency UI | Undermines high-stakes module | «Пилот KB» + version/source only |
| CT-09 | Launch date thrice | Global banner + landing + auth | Anxiety / unfinished feel | One persistent notice, shorter |
| CT-10 | «Проект полностью готов» + «тестовый режим» | Same banner stack | Contradictory claims | Align messaging |
| CT-11 | Telegram VPN notes everywhere | Sidebar/footer | Operational noise in clinical chrome | Move to Help/Contacts |
| CT-12 | Achievement toast emoji | Achievements | Gamification tone vs OR | Optional / settings |

No `lorem ipsum` found in primary UI paths. Demo PHI-looking labels confined mainly to IDEA feature (`PX-1001`).

---

## F. Technical Audit

### F1. Verified

| Check | Result |
|---|---|
| Landing `/` | 200, interactive |
| Login `/login` | 200 |
| Feed `/feed` | 200 |
| Cases `/cases` | 200; guest presence API **401** |
| Tools `/tools` | 200 |
| Pricing `/pricing` | 200 |
| Key calculators RADS/OB/GYN (prior smoke) | Mostly 200; UI interactive |
| Emergency retrieve API | OK (`ok:true`, MI guide) |
| Profile routes guest | 307 → login (expected) |
| Browser console on `/cases` | 1 error: presence 401; PWA preventDefault info |

### F2. Not verified this pass (explicit)

- Full TypeScript / ESLint CI greenness
- Fresh Lighthouse / CWV numbers (older report files exist under `apps/web/*.report.json` but scores were not successfully parsed in this pass)
- WCAG 2.2 AA axe full suite (`test:e2e:a11y` not executed here)
- Supabase RLS policy review / advisors
- Authenticated PRO checkout / patient CRUD
- Mobile native apps beyond PWA note on pricing

### F3. Security / trust notes (quality lens)

- Open-access pilot + repeated “не вводите ПДн” is responsible, but **over-communicated**.
- Auth subtitle with real mailbox pattern is a professionalism/security smell.
- Prior security audits exist in `docs/audits/security-*.md` — not re-opened here.

### F4. SEO / semantics (sample)

- Calculator pages use landing shells + FAQ regions — good structure.
- Long academic H1 for O-RADS is appropriate; document title strategy was recently shortened in repo (prod may lag deploy).
- Feed title falls back to generic «SonoGyn Pro» — weak SEO for `/feed`.

---

## G. Priority Matrix

| ID | Section | File / URL | Problem | Proof | Product impact | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|---|
| P-01 | Trust UX | Clinical shell banners | 2–3 simultaneous system banners | Screenshots feed/cases | Feels unfinished / unsafe | **Critical** | Collapse to one slim notice + link “подробнее” | S |
| P-02 | A11y | `/cases` light theme | Low-contrast text/controls | Playwright mobile screenshot | Unreadable community | **Critical** | Audit light tokens for chat hub; force minimum contrast | M |
| P-03 | Repo hygiene | `* 2.*` duplicates | ~322 duplicate files | `find … '* 2.*'` | Unprofessional codebase signal | **Critical** | Delete duplicates; add CI guard against `* 2.*` | M |
| P-04 | Auth | `login/page.tsx` | Pilot email in UI copy | Source lines ~133, ~389 | Looks like leaked staging | **High** | Remove concrete mailbox; generic help only | S |
| P-05 | Content | Landing hero | Cosmic/cliché H1 + “умный анализ” | Browser + `LandingMarketingHero.tsx` | AI-landing perception | **High** | Rewrite to clinical value prop; keep art | S |
| P-06 | Visual | Landing hero | Glow/glass/stat strip | Source + screenshot | Template SaaS look | **High** | Reduce glows; drop vanity stats; keep brand color | M |
| P-07 | Content | Feed | EN badges Case of the day / editorial | `feed/page.tsx` | Unpolished RU product | **High** | Localize / remove | S |
| P-08 | Content | Calculator shells | “Черновик · вычитка” on prod | `clinical-reviewer.ts` + UI | Undermines CDS trust | **High** | Gate by env / review flag | S |
| P-09 | IA | `clinical-shell.tsx` | Duplicate Live приём ×3; 32 links | Nav config | Cognitive overload | **High** | Dedupe; role-based nav; “Избранное” | M |
| P-10 | API/UX | `/api/doctor-presence` | 401 for guests | Console log | Broken open-access story | **High** | Soft empty state without 401 / skip call when guest | S |
| P-11 | Theme | ThemeProvider + cases | Dark feed vs light cases inconsistency | Screenshots same session | Brand fragmentation | **High** | Clinical default dark (or persist per shell) + test both | M |
| P-12 | Dead code | `LandingHero.tsx` + `* 2.tsx` components | Unused / duplicate | Grep | Maintenance risk | **Medium** | Remove or archive | S |
| P-13 | Visual | Global pills/rounded | Same radius language | Grep counts | Flat hierarchy | **Medium** | Radius scale by role (tool vs marketing) | M |
| P-14 | Content | Emergency “Тестовый режим” | Header copy | Browser emergency | High-stakes module looks beta | **Medium** | Versioned KB label | S |
| P-15 | Gamification | Achievements emoji | Toasts / badges | Source | Tone mismatch | **Medium** | Optional; clinical default off | S |
| P-16 | Legal | offer/privacy TODOs | User-visible TODO | Source | Compliance packaging | **Medium** | Finish LEGAL_* or hide unfinished | M |
| P-17 | Clinical debt | breast-classification TODOs | Incomplete ARFI rules | Package TODOs | Accuracy risk if exposed | **Medium** | Hide unfinished paths or finish | L |
| P-18 | IDEA | Demo patients / stubs | `PX-1001`, “заглушка” | Source | Demo smell | **Medium** | Feature-flag demo data | S |
| P-19 | SEO | `/feed` title | Generic title | Browser CDP | Weak discoverability | **Low** | Unique title/description | S |
| P-20 | IA | Soft catalog fallthrough | `/tools/calc/ob/crl` → catalog title | Prior HTTP | Confusing 200s | **Low** | Hard 404 or redirects | S |

---

## H. Professionalization Roadmap

### P0 — Critical (do first)

1. Collapse system banners to **one** persistent notice.
2. Fix `/cases` light-mode contrast (WCAG AA for text/controls).
3. Purge `* 2.*` duplicates + CI forbid pattern.
4. Remove concrete pilot email from login UI.
5. Stop guest calls that 401 (presence) or handle silently.

### P1 — Serious quality

6. Rewrite landing H1/features without cosmic/cliché AI language; keep cosmic **visual**.
7. Reduce hero glow/glass/stat strip; preserve brand violet/teal.
8. Localize feed/cases microcopy (no “Case of the day”, “Live Realtime”, “editorial”).
9. Hide or qualify “Черновик · вычитка” on production calculators.
10. Deduplicate sidebar; introduce Favorites / specialty home.
11. Align theme defaults across clinical routes.

### P2 — Visual & product polish

12. Radius/elevation scale (marketing ≠ calc ≠ data table).
13. Replace vanity KPIs with clinical proof points (guidelines covered, modules).
14. Tone down gamification in clinical contexts.
15. Emergency: replace “тестовый режим” with KB version/source.
16. Remove dead `LandingHero` and unused copies.
17. Telegram/VPN notes → Help only.

### P3 — Optional

18. Finish legal TODO surfaces.
19. Complete or hide ARFI / FMF percentile TODOs.
20. Soft-404 hygiene for unknown calculator slugs.
21. Unique SEO titles for feed/community.
22. Authenticated profile/PRO UX audit (separate pass).

---

## I. Final Verdict

### 1. How professional does it look?

**Clinically: yes, substantially. As a premium product shell: partially.**  
A physician will trust O-RADS/BI-RADS/TI-RADS/Неотложка more than the landing “universe” story. Overall **~6/10** as international Healthcare SaaS packaging; **~8/10** as clinical decision-support toolkit.

### 2. Are there noticeable AI-template design signals?

**Yes, especially on marketing and chrome:** purple glows, glass cards, pill clusters, Sparkles-as-AI, stat strips, repeated card hubs, stacked beta banners, and English decorative badges.  
These sit **on top of** a real clinical system — not instead of it.

### 3. Weakest sections

1. Marketing landing (language + glow template).  
2. Clinical chrome (banner stack + oversized sidebar).  
3. `/cases` light theme contrast + guest 401.  
4. Repo hygiene (`* 2.*` duplicates).  
5. Public “черновик/тест” labeling on serious modules.

### 4. What blocks “mature medical SaaS” perception?

- Contradictory “fully ready” + “test mode” messaging.  
- Visual dualism (cosmic marketing vs uneven clinical light/dark).  
- IA density and duplicate entries.  
- Pilot artifacts (email hint, draft stamps, demo stubs).  
- Homogeneous card directories instead of task-first workplaces.

### 5. Top 20 fixes with maximum effect

1. Single system banner.  
2. Cases light contrast fix.  
3. Delete `* 2.*` duplicates + CI.  
4. Remove login mailbox hint.  
5. Silence guest presence 401.  
6. Clinical landing H1 rewrite.  
7. Hero glow/stats reduction.  
8. RU-only clinical microcopy (feed/cases).  
9. Prod review-status gating.  
10. Sidebar dedupe + Favorites.  
11. Theme consistency (clinical default).  
12. Emergency label professionalism.  
13. Kill dead LandingHero / copy files.  
14. Tokenize remaining raw violet utilities.  
15. Soften gamification defaults.  
16. Move Telegram/VPN to Help.  
17. Feature-flag IDEA demos.  
18. Hard 404 unknown calc slugs.  
19. Finish or hide legal TODOs.  
20. Separate “marketing art” vs “clinical tool” design rules in a short brand discipline doc.

---

## Appendix — Evidence index

| Evidence | Source |
|---|---|
| Landing structure / copy | Browser snapshot `https://sonogyn-pro.ru/` 2026-11-18 |
| Landing visual | Screenshot MCP landing (dark cosmic + glass CTA) |
| Login | Browser `/login` + `apps/web/app/login/page.tsx` |
| Feed | Browser + screenshot; `apps/web/app/(clinical)/feed/page.tsx` |
| Cases contrast + 401 | Playwright mobile screenshot; console log presence 401 |
| Tools hub | Browser `/tools` |
| Pricing | Playwright `/pricing` |
| Design tokens vs violet | ripgrep counts `--clinical-*` ≈3821; `violet-/purple-` ≈145 |
| Glass/glow | `LandingMarketingHero.tsx`, `globals.css` `.sonogyn-glass-card` / `.sonogyn-cta-glow` |
| Duplicate files | `find … '* 2.*'` ≈322 |
| Nav density | `clinical-shell.tsx` nav groups |
| Prior functional smoke | Same-day production calculator/emergency audit |

---

## Stop

Аудит завершён. **Исправления не выполнялись.**  
Следующий шаг — согласовать пакет P0/P1 и только после явного «делай» переходить к реализации.
