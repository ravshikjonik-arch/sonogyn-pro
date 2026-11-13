# Массовый пилот (коллеги) — блокеры

Без выдуманных ИНН и ложного «Проверил». На Vercel production сейчас **нет** `YOOKASSA_*`, `STRIPE_*`, `NEXT_PUBLIC_LEGAL_*`, `NEXT_PUBLIC_GA_ID`.

## 1. Оплата PRO (витрина)

В кабинете ЮKassa → скопировать shop id и секретный ключ. В Vercel (production + preview):

```
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
YOOKASSA_PRO_PRICE_RUB=990
```

Webhook URL (после ключей): `https://sonogyn-pro.ru/api/yookassa/webhook` (или актуальный route в репо).

Пока ключей нет — на сайте честный **Free · пилот** + лист ожидания PRO (без кнопки «Оплатить»).

## 2. Реквизиты (футер / оферта / контакты)

```
NEXT_PUBLIC_LEGAL_ENTITY_NAME=ИП … / ООО …
NEXT_PUBLIC_LEGAL_INN=…
NEXT_PUBLIC_LEGAL_OGRN=…   # опционально
NEXT_PUBLIC_LEGAL_ADDRESS=… # опционально
NEXT_PUBLIC_SUPPORT_EMAIL=support@sonogyn-pro.ru
```

В чат Cursor можно одной строкой:

`LEGAL: ИП …, ИНН …, ОГРН …, адрес …`

## 3. Вычитка блога

Не ставим `reviewStatus: "reviewed"` без OK. В чат:

`reviewed: slug1, slug2, …`

Чеклист: `docs/seo-blog-review-checklist.md`.  
Пока pending: подпись **«Черновик · вычитка врача»**.

## 4. GA4 (опционально)

`NEXT_PUBLIC_GA_ID=G-…`

## После вставки env

1. Redeploy production.  
2. Smoke: `/pricing` показывает цену и CTA оплаты; футер — «© … ИНН …».  
3. Тестовый платёж ЮKassa (тест-магазин).  
4. Волна коллег 50–150 → потом шире.
