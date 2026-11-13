# ЮKassa → SonoGyn Pro (PRO)

Код уже готов: `POST /api/payment/create`, webhook `POST /api/payment/webhook`  
(алиасы: `/api/yookassa/create`, `/api/yookassa/webhook`).

## 1. Кабинет ЮKassa

1. Зайдите: https://yookassa.ru/my  
2. Магазин → **Настройки** → **Ключи API**  
3. Скопируйте:
   - **shopId** → `YOOKASSA_SHOP_ID`
   - **Секретный ключ** → `YOOKASSA_SECRET_KEY`  
4. Для теста сначала включите **тестовый магазин** (test shopId / test secret).  
5. HTTP-уведомления → URL:

```
https://sonogyn-pro.ru/api/payment/webhook
```

Событие: `payment.succeeded` (и при необходимости `payment.waiting_for_capture` / `payment.canceled` — обработчик идемпотентен).

## 2. Что прислать в Cursor (одной строкой)

```
YOOKASSA: shop=XXXXXX secret=live_xxx_или_test_xxx price=990
```

Секрет в чат — только если готовы; иначе вставьте сами в Vercel:

Project → Settings → Environment Variables → production + preview:

| Key | Value |
|---|---|
| `YOOKASSA_SHOP_ID` | shopId |
| `YOOKASSA_SECRET_KEY` | secret (encrypted) |
| `YOOKASSA_PRO_PRICE_RUB` | `990` |

После сохранения — **Redeploy** production.

## 3. Проверка

1. https://sonogyn-pro.ru/pricing — цена и «Войти и оплатить через ЮKassa»  
2. Войти → `/paywall` → оплата тестовой картой ЮKassa  
3. Профиль PRO / квоты обновились после webhook  

Тестовые карты: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing  

## 4. БД

Нужны миграции `payments` / бывш. `yookassa_payments` (уже в репо).  
Если webhook пишет ошибку таблицы — применить миграции на prod Supabase (отдельный явный запрос).
