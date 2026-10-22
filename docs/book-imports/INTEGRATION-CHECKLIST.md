# Чеклист интеграции книг → нозологии (SonoGyn Pro)

Обновлено после волны: реестр `@repo/book-nosology-registry`, seed-нозологии МЖ/ВПС, пороки по CSV.

## Данные Desktop

- [ ] `~/Desktop/sonogyn-cervix` — `extracted/index.json`, `cervix-morpho-atlas/index.csv`
- [ ] `~/Desktop/sonogyn-mammology` — OCR глав, `page_scans_by_chapter/`
- [ ] `~/Desktop/sonogyn-prenatal` — **`sonogyn-us-atlas/index.csv`** (для пороков по снимкам)
- [ ] `~/Desktop/sonogyn-echo` — `translated/*.md` (45/48 глав)

```bash
pnpm verify:desktop-books
pnpm import:desktop-books          # JSON атласов
pnpm generate:book-nosology        # реестр 111+ глав + ~400 пороков
```

## Web — маршруты

| Проверка | URL |
|----------|-----|
| Клинические нозологии (21) | `/tools/refs/nosologies` |
| Атласы книг по зонам | `/tools/refs/nosologies#book-atlas` |
| Карточка темы книги | `/tools/refs/book-nosology/{id}` |
| Цервикс гистология | `/tools/refs/cervix-morphology-atlas` |
| Маммология | `/tools/refs/mammology-national-atlas` |
| Пренатал | `/tools/refs/prenatal-echography-atlas` |
| Otto | `/tools/refs/clinical-echocardiography-atlas` |
| BI-RADS | `/tools/calc/rads/bi-rads` |
| Фетометрия Медведев | `/tools/calc/ob/fetometry-norms` |

## Связи seed ↔ книги

- [ ] `cervix-pathology` → 6 глав морфо-атласа
- [ ] `breast-*` (4) → главы Каприна 4, 9–14
- [ ] `fetal-chd-suspicion` → пренатал гл. 10, 15
- [ ] FGR, воды, плацента, короткая шейка → главы пренатала (bridge)

Файл: `packages/book-nosology-registry/data/seed-nosology-bridge.json`

## Пороки по снимкам (пrenatal-finding)

- [ ] Фильтр **«Пороки (снимки)»** на странице нозологий
- [ ] Карточка порока: галерея до 6 JPEG + ссылка на главу атласа
- [ ] Подписи ~5% могут быть неточны — сверять с книгой

## Otto

- [ ] Главы **46–49** без RU — в UI «перевод в работе»
- [ ] Добавить `translated/46.md` … на Desktop → `pnpm import:otto-echo-atlas`

## Mobile

- [ ] Экран нозологий в Expo — **без** атласов книг (gap)
- [ ] План: deep link на web `/tools/refs/nosologies`

## Тесты

```bash
pnpm --filter @repo/book-nosology-registry test
pnpm --filter @repo/clinical-tools test
pnpm --filter @repo/nosology test
pnpm --filter @repo/web test:e2e:fetometry-norms   # опционально
```

## Prod

- [ ] `git push` → Vercel green
- [ ] Smoke: `/tools/refs/nosologies` содержит `#book-atlas`
- [ ] Крупные JPEG prenatal/mammology уже в `public/clinical-atlas/`

## Дисклеймер

Учебный контент. Не диагноз — интерпретация специалиста; нормы скрининга — ISUOG/FMF/КР.
