# SonoGyn Pro — Architecture Hub

> Principal Architect pipeline · STEP 1–3 · **без кода до одобрения**

## Текущая продуктовая рамка

SonoGyn Pro — не приложение калькуляторов, а клиническая платформа для врача УЗИ
и акушера-гинеколога.

Ядро первого релиза:

1. **Чат врачей** — кейсы, фото/видео, обсуждения, экспертные ответы.
2. **AI-помощник врача** — клиническая навигация, поиск по приказам/КР,
   Evidence, подсказка нужного инструмента.
3. **Помощник врача-гинеколога** — структурированная база нозологий,
   обследований, "рекомендуем / не рекомендуем", источников.
4. **Помощник врача-акушера** — акушерские нозологии, тактика, КР/приказы,
   маршрутизация по беременности.
5. **Помощник врача УЗИ** — УЗИ-кейсы, ассистивный разбор изображения,
   O-RADS, BI-RADS, FMF/RU, IOTA, FIGO, фетометрия, допплер, шейка,
   плацента, воды и др.

Главный документ по новой стратегии: [platform_first_architecture.md](./platform_first_architecture.md).

## Продуктовые персоны

| ID | Персона | Фаза |
|----|---------|------|
| `practitioner` | 👨‍⚕️ Врач-практик | 1 |
| `learner` | 🎓 Студент / ординатор | 2 |
| `self_check` | 📝 Самопроверка / экзамены | 2–3 |

## Документы

| Документ | Содержание |
|----------|------------|
| [platform_first_architecture.md](./platform_first_architecture.md) | Новая стратегия: чат врачей + AI-помощник как ядро платформы |
| [medical_access_model.md](./medical_access_model.md) | Модель допуска: студент, ординатор, врач, подтвержденный врач |
| [orads_guidance_like_calculator.md](./orads_guidance_like_calculator.md) | Направление O-RADS: guided-калькулятор + расчет по тексту + AI-помощник |
| [structured_reporting.md](./structured_reporting.md) | PRD, DB, API, сервисы — **Фаза 1 #1** |
| [master_architecture.md](./master_architecture.md) | O-RADS, IOTA, Cases, Learning, AI Tutor, Exams, CDE |
| [review_and_roadmap.md](./review_and_roadmap.md) | Риски, roadmap ≤4h tasks |

## Старый порядок фаз

Этот порядок остается полезным как техническая карта, но больше не является
главной продуктовой рамкой.

**Фаза 1:** Structured Reporting → O-RADS Navigator → IOTA Navigator → Case Library  
**Фаза 2:** AI Tutor → Exam Engine → Daily Image Challenge  
**Фаза 3:** Clinical Decision Engine → AI Second Opinion → Корпоративный кабинет

## Принципы

- Shared packages first (`packages/*`)
- Zod + RLS обязательны
- Web + Mobile parity
- Backward compatibility
- Architecture before code
