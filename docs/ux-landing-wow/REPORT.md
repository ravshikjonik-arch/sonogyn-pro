# Landing «вау» — smoke report

**Дата:** 2026-08-01  
**Экран:** `/landing`  
**Персона:** врач-практик  

## Что сделано

1. **Hero** — одна композиция: бренд → headline → sub (дисклеймер CDS) → CTA; full-bleed `/clinical/orads-hero/ovary-us-waves.jpg`; motion `sonogyn-enter` + kenburns; `prefers-reduced-motion` в `globals.css`.
2. **Header** — тонкая frosted-bar, не конкурирует с hero-брендом.
3. **Below-fold** — Features списком; HowItWorks без карточек; Pricing на clinical tokens.

## Smoke

| Проверка | Результат |
|---|---|
| Title содержит SonoGyn Pro | ✅ |
| CTA guest: `/register`, `/login` | ✅ |
| Hero image loaded (next/image) | ✅ |
| Light tokens (`data-theme=light`) | ✅ `--clinical-canvas: #dceef7` |
| Dark tokens (`data-theme=dark`) | ✅ `--clinical-canvas: #0b0f19` |
| Auth-ветки не менялись | ✅ `isAuthenticated` → `/app` / `/paywall` |

Скриншоты: `landing-wow-light.png`, `landing-wow-dark.png` (в этой папке).

## Вне scope / не трогали

- O-RADS / Evidence логика, auth API, mobile app  
- Тяжёлый 3D/видео  

## A11y

Локальный `test:e2e:a11y` не стартовал: в sandbox нет Chromium Playwright (`npx playwright install`). Smoke сделан через MCP Playwright на живом `/landing` (title, CTA, light/dark tokens, hero img).

## Консольные CSP (dev)

Ошибки `inline style` / Next DevTools / sonner — известный фон локального CSP, не регрессия этого прохода.
