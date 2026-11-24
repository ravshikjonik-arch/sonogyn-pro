# EAS build **37+** — когда собирать

**Актуальный ASC build:** **38** (EAS `ce560658-e054-44f4-93c8-9f8a8f4e39ba`; EAS сам поднял 37→38). Не делать **Submit** в Connect, пока **36** в **In Review**, если Apple **не** попросил новый бинарник (TestFlight — можно).

## Зачем 37

| Фича | В build 36 | С ветки `copyright-cleanup` (prod web уже есть) |
|------|------------|--------------------------------------------------|
| Telegram deep link → `sonogyn-pro.ru` (`mobile/start`, Hermes `login_`) | Нет (старый `chatBackend`) | Да |
| O-RADS «Описание / фото» → `/api/ai/gyn-assist` | Зависит от даты срезки 36 | Да |
| Legacy JWT chat-server | Мёртвый код вынесен в `legacyChatServerClient.ts` | Да |

## Перед сборкой

1. `git pull` на `copyright-cleanup`, `pnpm typecheck`.
2. `apps/mobile/eas.json` — `EXPO_PUBLIC_API_BASE_URL`: `https://sonogyn-pro.ru` (уже так).
3. В `app.config.ts` / `app.json`: **version** `1.0.4` или `1.0.5`, **buildNumber +1** → `37`.
4. Notes для ревью — обновить из `APP-STORE-RESUBMIT-CONNECT-RU.md` (ИИ, guest, Telegram).

## Команды

```bash
cd apps/mobile
eas build --platform ios --profile production
eas submit --platform ios --latest
```

## Smoke на TestFlight **37**

1. Guest: consent → калькуляторы.
2. Профиль → **Telegram** → бот → возврат в app (deep link `telegram_nonce`).
3. O-RADS → шаг с фото → ответ ассистента (нужен consent ИИ + сеть).
4. Обсуждения: лента кейсов без chat-server.

## Prod web

Должен быть ≥ `bc7dbdf8` на `sonogyn-pro.ru` (Hermes + `login_`). Отдельный webhook на `auth-login-webhook` **не** обязателен (сценарий B в `docs/operations/telegram-login-webhook-ru.md`).