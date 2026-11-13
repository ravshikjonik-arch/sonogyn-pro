import {
  CLINICAL_CONTENT_DISCLAIMER,
  CLINICAL_CONTENT_REVIEWER,
} from "@/lib/seo/clinical-reviewer";

export type BlogSource = {
  label: string;
  year?: string;
  href?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** Краткий тип для хаба */
  kind: "guideline" | "case" | "how-to";
  publishedAt: string; // YYYY-MM-DD
  updatedAt: string;
  reviewedBy: typeof CLINICAL_CONTENT_REVIEWER;
  sources: BlogSource[];
  related: { href: string; label: string }[];
  /** Markdown без выдуманных cut-off; пороги — только в калькуляторе / гайдлайне */
  bodyMarkdown: string;
};

/**
 * Первые статьи SEO-слоя (промпт 09).
 * Числовые пороги не дублируем в тексте — отсылаем к калькулятору и первоисточнику.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "orads-adnexa-2-minutes",
    title: "O-RADS: как оценить придатки за 2 минуты",
    description:
      "Рабочий маршрут врача УЗИ по ACR O-RADS US v2022: что зафиксировать в протоколе и как открыть калькулятор SonoGyn Pro без подмены диагноза.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ACR O-RADS US — American College of Radiology",
        year: "2022",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
      },
      {
        label: "Калькулятор O-RADS US в SonoGyn Pro",
        href: "/tools/calc/rads/o-rads",
      },
    ],
    related: [
      { href: "/tools/calc/rads/o-rads", label: "Калькулятор O-RADS US" },
      { href: "/tools/calc/rads/iota", label: "IOTA ADNEX / LR2" },
      { href: "/tools/o-rads", label: "Комната O-RADS" },
      { href: "/blog/iota-adnex-vs-orads", label: "IOTA vs O-RADS" },
    ],
    bodyMarkdown: `
## Зачем этот маршрут

O-RADS US (ACR) — **lexicon и категории стратификации риска** для аднексальных образований на УЗИ. Это не диагноз рака и не замена полного протокола. В SonoGyn Pro калькулятор помогает быстро собрать признаки и черновик категории; заключение остаётся за лечащим специалистом.

## Что успеть за 2 минуты на приёме

1. **Контекст.** Возраст / менопаузальный статус, симптомы, доступность полного описания образования.
2. **Морфология.** Кистозное / солидное, число камер, перегородки, солидный компонент, васкуляризация — по lexicon ACR, без «угадывания» недостающих признаков.
3. **Категория.** Пройдите шаги в [калькуляторе O-RADS US](/tools/calc/rads/o-rads). Итоговая категория и размеры — **только из расчёта на экране**, не из этой статьи.
4. **Протокол.** Перенесите lexicon-формулировки в заключение; при неполном исследовании используйте статус incomplete / O-RADS 0 по правилам модуля и ACR.
5. **Связка.** При необходимости откройте [IOTA](/tools/calc/rads/iota) рядом — системы **сопоставляют**, но не смешивают в один «балл».

## Чего не делать

- Не подставлять категорию «на глаз», если ключевых признаков нет в кадре.
- Не публиковать пациенту скриншот калькулятора как «диагноз».
- Не копировать числовые cut-off из чужих блогов — сверяйте с актуальной редакцией ACR и с модулем продукта.

## Обезличенный сценарий

Пременопауза, однокамерное анэхогенное образование без солидного компонента. Врач отмечает lexicon-признаки в калькуляторе, сверяет предложенную категорию с полным описанием в протоколе и решает о наблюдении / дообследовании по локальному маршруту.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "iota-adnex-vs-orads",
    title: "IOTA ADNEX vs O-RADS: что выбрать",
    description:
      "Когда на приёме удобнее lexicon ACR O-RADS US, а когда — модели IOTA (Simple Rules, LR2, ADNEX). Без смешения шкал и без выдуманных AUC.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "IOTA Group",
        href: "https://www.iotagroup.org/",
      },
      {
        label: "ACR O-RADS US",
        year: "2022",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
      },
    ],
    related: [
      { href: "/tools/calc/rads/iota", label: "Калькулятор IOTA" },
      { href: "/tools/calc/rads/o-rads", label: "Калькулятор O-RADS US" },
      { href: "/blog/orads-adnexa-2-minutes", label: "O-RADS за 2 минуты" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    bodyMarkdown: `
## Две разные рамки

| Рамка | Суть | В SonoGyn Pro |
|---|---|---|
| **O-RADS US (ACR)** | Lexicon + категории 0–5 для стратификации | [/tools/calc/rads/o-rads](/tools/calc/rads/o-rads) |
| **IOTA** | Модели triage / вероятности (Simple Rules, LR2, ADNEX и др.) | [/tools/calc/rads/iota](/tools/calc/rads/iota) |

Это **не** взаимозаменяемые «баллы». Их можно использовать рядом в одном заключении, явно указывая систему.

## Когда начинать с O-RADS

- Нужен **единый lexicon** для протокола и общения с гинекологом-онкологом.
- Важно зафиксировать полноту исследования (incomplete / 0).
- Команда уже работает в логике ACR RADS.

## Когда полезен IOTA

- Есть полный набор предикторов для выбранной модели (в т.ч. лабораторные поля, если модель их требует).
- Центр привык к Simple Rules как быстрому triage или к ADNEX как вероятностной оценке.
- Нужно **сопоставить** модельный вывод с O-RADS-категорией, а не заменить одну систему другой.

## Практический порядок в продукте

1. Опишите образование в O-RADS (lexicon).
2. При необходимости откройте IOTA с теми же клиническими данными.
3. В протоколе напишите обе рамки раздельно: «O-RADS US: …; IOTA ADNEX: …».
4. Тактику (наблюдение / МРТ / хирургия) принимайте по клинике и локальному маршруту — не по одному числу из модели.

## Чего нет в этой статье

Мы **не** публикуем здесь AUC, чувствительность или «магические» пороги вероятности — они зависят от популяции и редакции модели. Актуальные входы и выводы смотрите в калькуляторе и на сайте IOTA / ACR.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "endometrium-thickness-phases",
    title: "Норма толщины эндометрия по фазам — таблица маршрута",
    description:
      "Как фиксировать M-эхо по фазе цикла и менопаузальному статусу. Числовые пороги — только в калькуляторе и актуальных КР/ISUOG, не в маркетинговом тексте.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ISUOG — gynecological ultrasound guidelines",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
      {
        label: "Рубрикатор клинических рекомендаций МЗ РФ",
        href: "https://cr.minzdrav.gov.ru/",
      },
      {
        label: "Калькулятор эндометрия в SonoGyn Pro",
        href: "/tools/calc/gyn/endometrium",
      },
    ],
    related: [
      { href: "/tools/calc/gyn/endometrium", label: "Калькулятор эндометрия" },
      { href: "/tools/refs/norms", label: "Справочник норм" },
      { href: "/tools/refs/exam-checklists", label: "Чек-лист УЗИ ОМТ" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    bodyMarkdown: `
## Почему здесь нет колонки «мм нормы»

Единой цифры M-эхо «для всех» **нет**. Ориентиры зависят от фазы цикла, менопаузы, кровотечения и редакции гайдлайна/КР. Дублировать cut-off в блоге опасно: текст устаревает быстрее модуля. Поэтому таблица ниже — **маршрут фиксации**, а числа берёте из [калькулятора эндометрия](/tools/calc/gyn/endometrium) и первоисточников.

## Таблица маршрута (что записать в протокол)

| Контекст | Что обязательно зафиксировать | Куда смотреть дальше |
|---|---|---|
| Пременопауза, известен день цикла | День / фаза, толщина M-эхо, структура, очаги | Калькулятор + КР / ISUOG |
| Пременопауза, день неизвестен | Статус «день не указан», M-эхо, структура | Не додумывать фазу; калькулятор подскажет ограничение |
| Постменопауза без кровотечения | M-эхо, структура, симптомы | Калькулятор + локальный маршрут |
| Постменопауза с кровотечением | M-эхо **и** клиника кровотечения | Не опираться только на цифру; решение клинициста |
| Подозрение на полип / неоднородность | Описание очага, допплер при необходимости | Дообследование по показаниям |

## Как пройти за минуту в SonoGyn Pro

1. Откройте [/tools/calc/gyn/endometrium](/tools/calc/gyn/endometrium).
2. Укажите статус (пре-/постменопауза) и измеренное M-эхо.
3. Отметьте очаговые изменения, если есть.
4. Прочитайте справочный вывод модуля — это CDS, не диагноз.
5. Сверьте тактику с актуальной КР МЗ РФ / ISUOG и клиникой.

## Обезличенный сценарий

Постменопауза, измеренное M-эхо внесено в калькулятор. Врач читает комментарий модуля и решает о дообследовании по кровотечению и локальному протоколу — без подстановки «нормальных мм» из статьи.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
];

const bySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

export function getBlogPost(slug: string): BlogPost | undefined {
  return bySlug.get(slug);
}

export function listBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
