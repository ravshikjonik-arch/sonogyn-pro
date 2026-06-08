# CHANGELOG — доработка AI (клинический продукт УЗИ/АГ)

Дата: 2026-05-20

## Исправлено

- **TypeScript (mobile):** добавлены зависимости `@expo/vector-icons`, `three-stdlib` — устранены ошибки `tsc`.
- **fmfMath (mobile):** переведён на общий пакет `@repo/medical-calculations` (единые формулы с вебом).
- **HTML/PDF:** исправлены некорректные теги в шаблоне отчёта.
- **UltrasoundProtocolForm:** исправлен порядок вычислений (warnings / EFW), заменены битые JSX-теги.

## Добавлено

### Telegram-канал [UltraGyn Analytics](https://t.me/UltraGynAnalytics)

- Ссылка в боковом меню (веб), библиотеке, лендинге, мобильной библиотеке и профиле
- Конфиг: `apps/web/lib/brand/telegram.ts`, `apps/mobile/src/config/telegram.ts`

### Справочник «Нозологии» (вместо PDF-книги)

**Контекст:** файл `помощник от петра.docx` содержит в основном перечень кодов МКБ-10; клинические алгоритмы добавлены в приложение как структурированная база.

**Пакет `@repo/nosology`:**
- 10 гинекологических нозологий (миома, аденомиоз, полип, гиперплазия, рубец/истмоцеле, кисты, эндометриома, гидросальпинкс, шейка, эндометриоз)
- IndexedDB (`idb`) — офлайн-хранилище с сидом из `nosologies.seed.json`
- Поиск, избранное, недавние, личные заметки (`localStorage`)
- Шаблоны вставки в протокол с плейсхолдерами `{размер}`, `{локализация}`, `{степень}`
- Экспорт/импорт JSON для администратора
- Юнит-тесты: `search.test.ts`

**Веб:**
- `/nosologies` — список по анатомическим зонам + поиск
- `/nosologies/[id]` — вкладки Обследование / Диагностика / Лечение / Рекомендации / Первоисточник (PDF-заглушка)
- `/admin/nosologies` — CRUD (только `role=admin`)
- Протокол УЗИ: поле «Диагноз», кнопка **«📋 Нозологии»**, автокомплит, вставка без потери данных
- Навигация: пункт **«Нозологии»** в clinical shell

**Mobile:** экран `Nosology` в библиотеке (чтение из сида).

**PDF-книга:** отдельного BookViewer в репозитории нет (ранее удалён Umarov). Вкладка «Первоисточник» готова к `NEXT_PUBLIC_NOSOLOGY_PDF_URL`.

### Модуль «Визуализация матки» (3D)

- `@clinical/uterus`: маркеры патологий (миома, аденомиоз, полип, рубец), FIGO-классификатор, генерация текста протокола, масштаб модели
- `UterusVisualizationModal` — полноэкранный 3D-редактор в протоколе УЗИ (кнопка «3D модель» у поля «Матка»)
- Снимок схемы PNG → `uterus_visualization` в протоколе и в PDF-отчёте
- Юнит-тесты: `packages/clinical-uterus/src/figoClassifier.test.ts`

### Клинический справочник (вместо издания Умаров)

**Удалено:** интеграция скана «Нормы в УЗИ» (PDF/JPG, `build-umarov-book.mjs`, модуль `umarov2021`).

**Добавлено:** `@repo/clinical-reference` — встроенные методики (ISUOG, Hadlock, Robinson-Fleming и др.) без копирования защищённого текста.

- `/reference` — поиск и чтение тем
- `FieldHelpPopover` в протоколе УЗИ (иконка «?»)
- Mobile: `ClinicalReference` в библиотеке

### `packages/medical-calculations`

- Модуль медицинских расчётов с комментариями и ссылками на источники:
  - **EFW:** Hadlock IV (BPD-HC-AC-FL, 1985), Hadlock III (HC-AC-FL), Shepard (BPD, 1982), Warsof (BPD, 1984)
  - **GA:** CRL (Robinson-Fleming), табличный CRL, одиночная фетометрия (BPD/HC/AC/FL/HL), комбинированная оценка
  - **AFI** (Phelan 1987), **PI/RI** допплер, перцентили роста (упрощённая таблица 20–40 нед)
  - **Валидация:** диапазоны мм, ПМП vs дата исследования, BPD vs срок, EFW vs срок
- Юнит-тесты: `estimatedFetalWeight.test.ts`, `gestationalAge.test.ts`

### `packages/types`

- Схемы: `PatientRow`, `CreatePatientBody`, `UltrasoundProtocolPayload`, `FetusBiometry`, `DopplerMeasurements`, `AmnioticFluid`

### Веб (`apps/web`)

- **Тёмная тема:** `ThemeProvider`, переключатель в `ClinicalShell`, `data-theme` / `data-theme-forced`
- **Пациенты:** страницы `/patients`, `/patients/new`, `/patients/[id]`, API `GET/POST/PATCH/DELETE /api/patients`
- **Протокол УЗИ:** форма фетометрии, AFI, допплер, органы, заключение; API `PUT/GET /api/studies/[id]/protocol`
- **PDF:** печать протокола через `buildStudyReportHtml` + `window.print()`
- **Беременность:** `/patients/[id]/pregnancy` — график EFW, напоминания о скринингах
- **Безопасность:** `encryptedStorage` (AES-GCM черновики), `safeLog` (редакция PHI)
- **UX:** Ctrl+S сохранение протокола, мм/см, мгновенный поиск пациентов

## Изменено

- Навигация clinical shell: пункт «Пациенты»
- Middleware: защита маршрутов `/patients/*`
- Workspace исследования: блок протокола над загрузкой снимков

## Рекомендации на будущее

1. **DICOM** — интеграция с PACS (Orthanc, dcm4chee), просмотр серий в браузере
2. **Облачная синхронизация** — офлайн-first с conflict resolution для планшетов в кабинете
3. **OAuth / SSO** — корпоративный вход (Keycloak, Azure AD) для клиник
4. **Полноценный EMR** — направления, назначения, интеграция с МИС по HL7 FHIR
5. **Перцентили** — подключение INTERGROWTH-21st / Hadlock tables вместо упрощённой таблицы
6. **Подпись отчёта** — КЭП / QR, юридически значимый PDF
7. **Аудит** — запись всех просмотров PHI (таблица `audit_log` уже заложена в миграциях)
8. **Мобильное EMR** — перенос пациентов/протоколов с Firebase на Supabase или гибрид
9. **bcrypt на сервере** — при собственном auth вне Supabase; сейчас хеширование делегировано Supabase Auth
10. **E2E-тесты** — Playwright для протокола и пациентов

## Настройка для запуска новых фич

| Фича | Требуется |
|------|-----------|
| Пациенты / протоколы | Supabase + миграции `20260506000000_clinical_copilot_schema.sql` |
| PDF | Только браузер (без внешнего API) |
| Stripe / Pro | Ключи Stripe в `.env.local` |
| Mobile кейсы | Firebase `EXPO_PUBLIC_FIREBASE_*` |
