# Чеклист «вместо вкладок браузера» — SonoGyn Pro

Дата: 2026-11-10 · ветка `copyright-cleanup` · персона: 👨‍⚕️ врач-практик

Цель: один кабинет вместо 8–12 вкладок. Статусы ниже — продуктовая правда, не маркетинг.

| Вкладка раньше | Задача | В SonoGyn | Где | Статус |
|---|---|---|---|---|
| PubMed / Scholar | Найти статью / цитату | Evidence Assistant | `/tools/refs/evidence-assistant` | **Закрыто** (адаптеры + vault) |
| Рубрикатор КР / сайт МЗ / РАЭ | Открыть рекомендацию | Vault + Source Studio + Evidence | `/admin/source-studio`, Evidence | **Частично** — РАЭ (+КР410, ГСД), ETA, 557н; ВОЗ NC не в RAG; OCR — локальный Docling+gate |
| Калькуляторы O-/TI-/BI-RADS, IOTA… | Посчитать категорию | Комнаты калькуляторов | `/tools/calc/*`, `/tools/o-rads` | **Закрыто** |
| Word / шаблон протокола | Написать заключение | Structured reports / протоколы | clinical tools + protocols | **Закрыто** (улучшения UX — отдельно) |
| МИС / Excel пациентов | Карточка, история | Patients | `/profile/patients` | **Частично** — не заменяет полноценную МИС |
| Telegram / чат коллег | Спросить мнение | Doctor chat | chat v2 | **Закрыто** (в рамках продукта) |
| Приказы / ГРЛС | Норматив, лекарство | Regulations + Evidence (ГРЛС и др.) | admin regulations, Evidence | **Частично** |
| PDF на диске / облаке | Свой конспект / книга | Source Studio (текст / URL whitelist) | `/admin/source-studio` | **Частично** — нет OCR сканов; книги только с license |
| «Стол приёма» (склейка) | Не прыгать по разделам SonoGyn | Appointment hub + ReceptionDeskStrip | `/tools/calc/appointment` | **Закрыто** (B3, склейка) |

## Что уже сделано в этой серии (B1–B3)

1. **B1** — импорт по https-ссылке (белый список) → `review_required`, без автопубликации; NC/WHO publish в RAG заблокирован.
2. **B2** — +3 открытые КР РАЭ (КР90, гипотиреоз, тиреотоксикоз) → published + embeddings (~132 чанка).
3. **B3** — полоса «Стол приёма» на `/tools/calc/appointment`.

## Ещё снаружи (осознанно)

| Тема | Почему снаружи | Когда трогать |
|---|---|---|
| OCR сканов PDF | Риск порчи цифр/кириллицы | Отдельный этап Docling+ревью |
| ВОЗ BY-NC в коммерческий RAG | Юр. риск | Только после юр. решения |
| Личные книги / атласы без license | Copyright | Не грузить |
| Полная МИС / расписание / ОМС-биллинг | Другой продукт | Не смешивать с Knowledge |
| RAGFlow Cloud | Free API 403 | Defer / self-host позже |

## Как проверить за 5 минут

1. `/tools/calc/appointment` — видна полоса «Стол приёма», ссылки открываются.
2. В Evidence: «узловой зоб» / «EU-TIRADS 5» / «гипотиреоз» — есть hits из vault.
3. `/admin/source-studio` — форма «Импорт по ссылке»; тестовый URL только из белого списка.
4. ВОЗ в выдаче RAG — **не** должна появляться (остаётся review / NC).

## Откат

- UI B1/B3: revert коммитов `08b98f4e`, `dc98902f`.
- Данные B2: в Source Studio → Reject / снять `rag_allowed` у трёх новых РАЭ (не DROP).
- Флаги vault: `EVIDENCE_MEDICAL_VAULT` / `_FTS` не трогали в этом этапе.
