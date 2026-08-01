# AI-среда SonoGyn Pro — что делает агент / что делаете вы

Короткий handoff. Секреты в этот файл не писать.

## Уже сделано агентом (Wave 0–3)

- `.cursor/rules/mcp-safety.mdc` + `a11y-dark-light.mdc`
- `.cursor/mcp.json` — Playwright, Context7, Figma, **Sentry** remote
- `.cursor/mcp.wave3.example.json` — Firecrawl (+ полный набор)
- `gh` установлен в `~/.local/bin/gh` (v2.74.1); auth ещё нужен вручную
- Codex: pin Playwright/Perplexity + бэкап
- Dependabot, CI auth/a11y/cpi/security
- A11y / Lighthouse / Visual smoke (opt-in)

## Шаг A / A2 — MCP (сделано)

Playwright + Context7 — verified ready.

## Шаг B — GitHub CLI auth (один раз)

`gh` уже установлен (`~/.local/bin/gh`). Нужен только login:

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login
```

Ответ: `B: gh ok`

## Шаг C — Wave 3: только вы (OAuth / ключи)

### C1. Figma (уже в `.cursor/mcp.json`)

1. Customize → **MCPs** → найти **`figma`**
2. **Connect / Authenticate** в браузере Figma
3. Ответ: `C1: figma green` или `C1: figma error: …`

Альтернатива: в чате Cursor команда `/add-plugin figma`.

### C2. Firecrawl (нужен API key)

1. Ключ с https://firecrawl.dev → в shell/profile:
   ```bash
   export FIRECRAWL_API_KEY=…   # значение не в чат
   ```
2. Скопировать блок `firecrawl` из `.cursor/mcp.wave3.example.json` в `.cursor/mcp.json`
   (или попросить агента: `C2: merge firecrawl` — после того как key в env)
3. Reload MCP → ответ: `C2: firecrawl green`

Запреты: не scrape localhost / private IP / patient URLs.

### C3. Sentry (уже в `.cursor/mcp.json`)

1. Customize → MCPs → **`sentry` → Connect**
2. Ответ: `C3: sentry green`

Опционально позже: `SENTRY_DSN` в `apps/web/.env.local` для runtime SDK.

### C4. Slack

Не подключать, пока не нужен. Ответ: `C4: skip` (по умолчанию).

## Visual regression

```bash
# baselines уже созданы для darwin locally
pnpm --filter @repo/web test:e2e:visual
# обновить скрины:
pnpm --filter @repo/web test:e2e:visual -- --update-snapshots
```

В CI visual пока **не** включён (soft / opt-in).

## Чего агент не делает сам

- OAuth Figma / Sentry / Slack / `gh auth login`
- Запись секретов в git
- SQL/migrations/deploy/push без запроса
- Чтение prod медданных

## Быстрые ответы

```
C1: figma green
C2: firecrawl green
C3: sentry green
C4: skip
B: skip
```
