# Блог SEO (промпт 09)

Контент: `apps/web/lib/seo/blog-posts.ts`. Sitemap — `listBlogPosts()`.

## Готово: 43 статьи + хаб `/blog`

Партии: #82 (3) → #83 (10) → #84 (10) → #85 (10) → batch5 (10).

Cut-off в текстах не публикуются — отсылка к калькулятору и первоисточнику.

Публичная подпись: по умолчанию **«На врачебной проверке»**. Поле `reviewStatus` на статье / посадочной:
- omit / `pending` → «На врачебной проверке»
- `reviewed` → «Проверил: Якубов Р.В.» (только после реальной вычитки; не ставить массово)

Хелпер: `formatClinicalReviewLabel` в `apps/web/lib/seo/clinical-reviewer.ts`.

### Клинические / калькуляторы
O-RADS 2 мин · IOTA vs O-RADS · эндометрий · Bishop · VBAC · EFW · TI-RADS · BI-RADS · POP-Q · CL · FIGO · чек-лист ОМТ · O-RADS 0 · FMF · эластография · кольпоскопия · LN-RADS · лекарства при беременности · поля ADNEX · Vascular US · Evidence vs гайдлайн · Appointment hub · IDEA · MUSA · эхограммы O-RADS · нозологии · допплер I триместра

### Продукт / доверие
Open access · PWA offline · Quiz · Career ladder · Telegram vs продукт · Dark/light · Cookie/analytics · Оферта · Contacts/SLA · Staging vs production · Mobile parity · Звёзды и XP · Обезличивание кейса · AI-чат без ПДн · Оплата PRO · «Слишком много запросов»

## Не для публичного блога

Внутренние инженерные темы (dev skip-auth, custom domain, Lighthouse, a11y e2e, Remotion) — в `docs/`, а не в `/blog`: врачу не нужны, а часть раскрывает детали безопасности.
