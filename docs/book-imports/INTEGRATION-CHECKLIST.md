# Чеклист интеграции книг → нозологии (SonoGyn Pro)

Статус: **web + prod + Supabase (prenatal/neishtadt) закрыты**; Otto 46–49 — EN-заголовок + заглушка «перевод в работе».

## Данные Desktop

- [x] `~/Desktop/sonogyn-cervix` — импорт в repo (`pnpm import:cervix-morpho-atlas`)
- [x] `~/Desktop/sonogyn-mammology` — импорт Kaprin
- [x] `~/Desktop/sonogyn-prenatal` — CSV → `prenatal-finding` в реестре
- [x] `~/Desktop/sonogyn-echo` — **45/48** глав RU; 46–49 — заглушки

```bash
pnpm verify:desktop-books
pnpm import:desktop-books          # JSON атласов (--skip-copy-images если уже в public)
pnpm generate:book-nosology        # реестр глав + пороки по CSV
pnpm upload:clinical-atlas-supabase  # prenatal-echo-ru + neishtadt-ovary → Storage
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

- [x] `cervix-pathology` → морфо-атлас
- [x] `breast-*` (4) → Каприн
- [x] `fetal-chd-suspicion` → пренатал
- [x] FGR, воды, плацента, короткая шейка → bridge

Файл: `packages/book-nosology-registry/data/seed-nosology-bridge.json`

## Пороки по снимкам (prenatal-finding)

- [x] Фильтр **«Пороки (снимки)»** на странице нозологий
- [x] Карточка порока: до 6 JPEG + ссылка на атлас
- [ ] Подписи ~5% могут быть неточны — сверять с книгой (ручная вычитка)

## Otto

- [x] Главы **46–49** — UI «перевод скоро» + текст «Перевод в работе»
- [ ] Добавить `translated/46.md` … на Desktop → `pnpm import:otto-echo-atlas` → `pnpm generate:book-nosology`

## Mobile

- [x] Баннер на экране нозологий → deep link web `#book-atlas`
- [ ] Нативные галереи книг в Expo (будущий релиз)

## Тесты

```bash
pnpm --filter @repo/book-nosology-registry test
pnpm --filter @repo/clinical-tools test
pnpm --filter @repo/nosology test
cd apps/web && node scripts/check-production-smoke.mjs
```

## Prod

- [x] `git push` → Vercel green
- [x] Smoke: book-atlas, 4 атласа HEAD, prenatal JPEG через rewrite
- [x] `prenatal-echo-ru` + `neishtadt-ovary` в Supabase Storage
- [x] Остальные JPEG в `public/clinical-atlas/` (Vercel static)

## Регуляторика (RF pipeline)

- [x] Миграция `regulation_ingest` на Supabase
- [x] `/admin/regulations` + cron ingest
- [x] Publish → Evidence (`rf_regulation`)
- [ ] Первые документы: review → `pnpm sync:regulations-catalog` → commit

См. `docs/architecture/REGULATION-INGEST-ONE-SHOT.md`

## Дисклеймер

Учебный контент. Не диагноз — интерпретация специалиста; нормы скрининга — ISUOG/FMF/КР.
