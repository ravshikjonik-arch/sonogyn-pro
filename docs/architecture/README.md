# SonoGyn Pro — Architecture Hub

> Principal Architect pipeline · STEP 1–3 · **без кода до одобрения**

## Продуктовые персоны

| ID | Персона | Фаза |
|----|---------|------|
| `practitioner` | 👨‍⚕️ Врач-практик | 1 |
| `learner` | 🎓 Студент / ординатор | 2 |
| `self_check` | 📝 Самопроверка / экзамены | 2–3 |

## Документы

| Документ | Содержание |
|----------|------------|
| [structured_reporting.md](./structured_reporting.md) | PRD, DB, API, сервисы — **Фаза 1 #1** |
| [master_architecture.md](./master_architecture.md) | O-RADS, IOTA, Cases, Learning, AI Tutor, Exams, CDE |
| [review_and_roadmap.md](./review_and_roadmap.md) | Риски, roadmap ≤4h tasks |

## Утверждённый порядок фаз (Равшан)

**Фаза 1:** Structured Reporting → O-RADS Navigator → IOTA Navigator → Case Library  
**Фаза 2:** AI Tutor → Exam Engine → Daily Image Challenge  
**Фаза 3:** Clinical Decision Engine → AI Second Opinion → Корпоративный кабинет

## Принципы

- Shared packages first (`packages/*`)
- Zod + RLS обязательны
- Web + Mobile parity
- Backward compatibility
- Architecture before code
