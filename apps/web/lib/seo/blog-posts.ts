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
  {
    slug: "bishop-when-to-score",
    title: "Bishop: когда считать на приёме",
    description:
      "Пять компонентов шкалы Bishop перед индукцией: что фиксировать в истории родов и как открыть калькулятор SonoGyn Pro без назначения индукции «по статье».",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Bishop EH. Pelvic scoring for elective induction", year: "1964" },
      { label: "Рубрикатор КР МЗ РФ (акушерство)", href: "https://cr.minzdrav.gov.ru/" },
      { label: "Шкала Bishop в SonoGyn Pro", href: "/tools/calc/ob/bishop" },
    ],
    related: [
      { href: "/tools/calc/ob/bishop", label: "Калькулятор Bishop" },
      { href: "/tools/calc/ob/vbac", label: "VBAC / TOLAC" },
      { href: "/tools/calc/ob/cervical-length", label: "Длина шейки" },
      { href: "/tools/calc/appointment", label: "Быстрый приём" },
    ],
    bodyMarkdown: `
## Когда имеет смысл считать Bishop

- Планируется **индукция** или обсуждается готовность шейки.
- Нужна **стандартизированная** запись пяти компонентов в историю родов.
- Сравниваете динамику зрелости между осмотрами (одна методика).

Не считайте «для галочки», если решение о родоразрешении уже принято по другим показаниям и балл не меняет маршрут.

## Пять полей — без cut-off из блога

| Компонент | Что оценить клинически | Где число |
|---|---|---|
| Раскрытие | По вагинальному осмотру | Сумма в [калькуляторе](/tools/calc/ob/bishop) |
| Сглаживание | % / длина по принятой в центре шкале | То же |
| Положение шейки | Относительно оси влагалища | То же |
| Консистенция | Мягкая / средняя / плотная | То же |
| Станция | Предлежащая часть относительно плоскостей | То же |

Пороги «достаточности» для индукции зависят от **протокола МО** и клиники — статья их не публикует.

## Маршрут в SonoGyn Pro

1. Откройте [/tools/calc/ob/bishop](/tools/calc/ob/bishop).
2. Внесите пять компонентов.
3. Перенесите сумму и компоненты в историю родов.
4. Решение об индукции — по КР / локальному протоколу, не по заголовку статьи.

## Обезличенный сценарий

Планируется индукция при доношенном сроке. Акушер вносит компоненты Bishop, фиксирует сумму и обсуждает тактику с дежурной бригадой.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "vbac-before-you-calculate",
    title: "VBAC: что фиксировать до расчёта",
    description:
      "Чек-лист данных перед калькулятором VBAC/TOLAC: рубец, акушерский анамнез, возможности стационара. Вероятность — справочно, не гарантия.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Рубрикатор КР МЗ РФ — роды после кесарева", href: "https://cr.minzdrav.gov.ru/" },
      { label: "ACOG — VBAC (международный ориентир)", href: "https://www.acog.org/" },
      { label: "Калькулятор VBAC в SonoGyn Pro", href: "/tools/calc/ob/vbac" },
    ],
    related: [
      { href: "/tools/calc/ob/vbac", label: "Калькулятор VBAC" },
      { href: "/tools/calc/ob/bishop", label: "Bishop" },
      { href: "/blog/bishop-when-to-score", label: "Когда считать Bishop" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## До открытия калькулятора

Соберите минимум, без которого модель бесполезна или противопоказана локальным протоколом:

1. Число и тип рубцов на матке, показания к предыдущему КС.
2. Интервал после операции, осложнения послеродового периода (если известны).
3. Текущий срок, предлежание, предполагаемая масса (см. [EFW](/tools/calc/ob/fetal-weight)) — как контекст, не как «приказ».
4. Готовность стационара к экстренному КС, анестезии, реанимации новорождённого.
5. Предпочтения пациентки и информированное согласие.

## Что даёт калькулятор

[Модуль VBAC](/tools/calc/ob/vbac) выдаёт **справочную** оценку по заложенным факторам. Высокий процент **не** гарантирует успех TOLAC; низкий — не заменяет очный консилиум.

## Чего не делать

- Не обещать пациентке «успех по калькулятору».
- Не игнорировать организационные противопоказания стационара.
- Не публиковать здесь AUC и «магические» пороги — они в модели и КР.

## Обезличенный сценарий

Один рубец после КС, доношенный срок. Врач заполняет поля VBAC, обсуждает вывод с пациенткой и фиксирует план в истории.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "efw-hadlock-limits",
    title: "EFW Hadlock — ограничения ошибки",
    description:
      "Почему предполагаемая масса плода — оценка с intrinsic-ошибкой: биометрия, формула, динамика и допплер важнее одной точки в граммах.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ISUOG — fetal biometry / growth guidelines",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
      { label: "Калькулятор EFW в SonoGyn Pro", href: "/tools/calc/ob/fetal-weight" },
      { label: "Нормы фетометрии", href: "/tools/calc/ob/fetometry-norms" },
    ],
    related: [
      { href: "/tools/calc/ob/fetal-weight", label: "Масса плода (EFW)" },
      { href: "/tools/calc/ob/fetometry", label: "Фетометрия" },
      { href: "/tools/refs/norms", label: "Справочник норм" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Главная мысль

EFW (в т.ч. семейство Hadlock) — **расчётная оценка**, не взвешивание. Ошибка заложена в метод; одна точка в граммах не должна быть единственным критерием родоразрешения.

## Что влияет на качество оценки

| Фактор | Практика |
|---|---|
| Качество биометрии | BPD/HC/AC/FL как на аппарате, корректные срезы |
| Выбор формулы | Тот стандарт, что принят в центре — явно в [калькуляторе](/tools/calc/ob/fetal-weight) |
| Динамика | Сравнение с предыдущими измерениями и перцентилями |
| Клиника | Допплер, ВЖК, состояние матери — рядом с цифрой |

## Маршрут в продукте

1. Измерьте биометрию по методике центра.
2. Внесите мм в [/tools/calc/ob/fetal-weight](/tools/calc/ob/fetal-weight).
3. При необходимости сверьте с [/tools/calc/ob/fetometry-norms](/tools/calc/ob/fetometry-norms) и [справочником норм](/tools/refs/norms).
4. При подозрении на FGR смотрите **динамику и допплер**, не одну EFW.

## Чего нет в статье

Конкретные граммы «нормы» и cut-off для КС — только в модуле, ISUOG и локальном протоколе.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "tirads-lexicon-3-minutes",
    title: "TI-RADS: lexicon за 3 минуты",
    description:
      "Быстрый проход ACR TI-RADS на УЗИ щитовидной железы: признаки → TR → решение о FNA по калькулятору и ACR, не по памяти из блога.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ACR TI-RADS",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/TI-RADS",
      },
      { label: "Калькулятор TI-RADS в SonoGyn Pro", href: "/tools/calc/rads/ti-rads" },
    ],
    related: [
      { href: "/tools/calc/rads/ti-rads", label: "Калькулятор TI-RADS" },
      { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
      { href: "/tools/calc", label: "Каталог" },
      { href: "/blog/birads-us-vs-mammography", label: "BI-RADS US vs маммография" },
    ],
    bodyMarkdown: `
## За 3 минуты на узле

1. **Состав, эхогенность, форма, края, очаги** — lexicon ACR, без смешения с EU-TIRADS.
2. Откройте [/tools/calc/rads/ti-rads](/tools/calc/rads/ti-rads) и отметьте признаки.
3. Получите уровень TR и ориентир к FNA **из модуля** (пороги размера — в ACR / калькуляторе).
4. Учтите мультифокальность и шейные ЛУ отдельным описанием.
5. Решение о биопсии — с эндокринологом / локальным маршрутом.

## Не смешивать шкалы

ACR TI-RADS ≠ EU-TIRADS. Баллы разных систем **не складываются**.

## Обезличенный сценарий

Солидный гипоэхогенный узел. Врач вносит lexicon, сверяет TR и показания к FNA с размером по ACR в калькуляторе.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "birads-us-vs-mammography",
    title: "BI-RADS US vs маммография: разные рамки",
    description:
      "Почему категория BI-RADS на УЗИ и на маммографии — разные модальности: как фиксировать в протоколе и где считать lexicon в SonoGyn Pro.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ACR BI-RADS Atlas — Ultrasound",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/BI-RADS",
      },
      { label: "Калькулятор BI-RADS US", href: "/tools/calc/rads/bi-rads" },
    ],
    related: [
      { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
      { href: "/tools/mapping/breast", label: "Карта молочной железы" },
      { href: "/blog/tirads-lexicon-3-minutes", label: "TI-RADS за 3 минуты" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Одна система названий — разные исследования

BI-RADS — семейство отчётов ACR. **US**, маммография и МРТ оцениваются отдельно. Категория на УЗИ может отличаться от маммографической — это не «ошибка калькулятора», а разные данные.

## Как писать в протоколе

- Явно указывайте модальность: «BI-RADS US: …».
- Не переносите автоматически категорию с маммографии на УЗИ и наоборот.
- При BI-RADS 0 на одной модальности дообследуйте по маршруту центра.

## В SonoGyn Pro

Модуль [/tools/calc/rads/bi-rads](/tools/calc/rads/bi-rads) собирает **УЗИ-lexicon**. Скрининговые программы и маммографический BI-RADS — вне этого экрана.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "popq-measurement-points",
    title: "POP-Q: точки измерения",
    description:
      "Aa, Ba, C, gh, pb, TVL, Ap, Bp, D — что зафиксировать одинаково «до/после». Числа в см — в калькуляторе, не в блоге.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "ICS / IUGA — POP-Q terminology", href: "https://www.ics.org/" },
      { label: "Калькулятор POP-Q", href: "/tools/calc/gyn/pop-q" },
    ],
    related: [
      { href: "/tools/calc/gyn/pop-q", label: "Калькулятор POP-Q" },
      { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
      { href: "/tools/refs/exam-checklists", label: "Чек-листы" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Зачем стандарт

POP-Q стандартизирует описание опущения. Сравнение «до/после» работает только при **одинаковой** методике (положение, натуживание).

## Точки (имена, без «норм см»)

| Точка / параметр | Смысл |
|---|---|
| Aa, Ba | Передняя стенка |
| C | Шейка / купол |
| gh, pb, TVL | Половая щель, промежность, длина влагалища |
| Ap, Bp | Задняя стенка |
| D | Дугласово пространство (если применимо) |

Ввод в см — в [/tools/calc/gyn/pop-q](/tools/calc/gyn/pop-q). Стадия и тактика — за гинекологом.

## УЗИ тазового дна

POP-Q — клинический осмотр. УЗИ дополняет по показаниям, не заменяет точки.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "cervical-length-isuog-context",
    title: "Cervical length: контекст ISUOG",
    description:
      "Длина шейки на УЗИ — методика и клинический контекст важнее одной цифры. Пороги и тактика — в калькуляторе, ISUOG и КР.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ISUOG guidelines",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
      { label: "Калькулятор длины шейки", href: "/tools/calc/ob/cervical-length" },
    ],
    related: [
      { href: "/tools/calc/ob/cervical-length", label: "Длина шейки" },
      { href: "/tools/calc/ob/bishop", label: "Bishop" },
      { href: "/tools/refs/norms", label: "Справочник норм" },
      { href: "/blog/efw-hadlock-limits", label: "Ограничения EFW" },
    ],
    bodyMarkdown: `
## Контекст важнее «мм из памяти»

Длина шейки интерпретируется вместе со сроком, симптомами, анамнезом преждевременных родов и возможностями наблюдения. **Не** публикуем здесь cut-off мм — они меняются с редакциями ISUOG/КР и заложены в модуле.

## Что зафиксировать

1. Срок гестации и доступ (трансвагинальный предпочтителен при возможности).
2. Методика измерения (сагиттальный срез, калиперы) — сверка со [справочником норм](/tools/refs/norms).
3. Значение в [калькуляторе длины шейки](/tools/calc/ob/cervical-length).
4. Клинические симптомы и план наблюдения по локальному протоколу.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "figo-myoma-types-map",
    title: "FIGO миома: типы узлов на схеме",
    description:
      "Как пользоваться схемой FIGO для миомы в кабинете: тип узла на карте матки без подмены клинического staging «из статьи».",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "FIGO — leiomyoma subclassification (ориентир системы)", href: "https://www.figo.org/" },
      { label: "Карта матки / FIGO в SonoGyn Pro", href: "/tools/mapping/uterus" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
    ],
    related: [
      { href: "/tools/mapping/uterus", label: "Карта матки" },
      { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
      { href: "/tools/refs/exam-checklists", label: "Чек-листы" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Зачем схема FIGO

Подклассификация миомы по отношению к полости и серозе помогает **одинаково** описывать узлы в протоколе и при обсуждении с хирургом. Это не замена полного staging и не «лечение по картинке».

## Маршрут в продукте

1. Откройте [/tools/mapping/uterus](/tools/mapping/uterus).
2. Соотнесите узел со схемой FIGO / MUSA-контекстом модуля.
3. Зафиксируйте тип(ы) в протоколе УЗИ / заключении.
4. Тактику (наблюдение, медикаменты, хирургия) — по клинике и КР.

## Чего нет здесь

Таблицы «тип → обязательно оперировать» и выдуманные размеры — не публикуем. Решение клиническое.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "omt-ultrasound-checklist",
    title: "Чек-лист УЗИ ОМТ — связка со справочником",
    description:
      "Как не пропустить органы и измерения на УЗИ органов малого таза: чек-лист + справочник норм + калькуляторы рядом.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Чек-листы УЗИ в SonoGyn Pro", href: "/tools/refs/exam-checklists" },
      { label: "Справочник норм", href: "/tools/refs/norms" },
      { label: "ISUOG guidelines", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    ],
    related: [
      { href: "/tools/refs/exam-checklists", label: "Чек-листы" },
      { href: "/tools/refs/norms", label: "Нормы" },
      { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
      { href: "/tools/calc/rads/o-rads", label: "O-RADS" },
    ],
    bodyMarkdown: `
## Зачем чек-лист

На потоке легко пропустить придаток, дугласово пространство или корректное M-эхо. Чек-лист держит **полноту протокола**, а не ставит диагноз.

## Связка инструментов

| Шаг | Куда |
|---|---|
| Пройти органы / срезы | [/tools/refs/exam-checklists](/tools/refs/exam-checklists) |
| Уточнить методику измерения | [/tools/refs/norms](/tools/refs/norms) |
| Эндометрий | [/tools/calc/gyn/endometrium](/tools/calc/gyn/endometrium) |
| Аднексальная масса | [/tools/calc/rads/o-rads](/tools/calc/rads/o-rads) |

## Практика

1. Откройте чек-лист до начала сканирования или сразу после.
2. Отмечайте выполненное; спорные измерения сверяйте со справочником.
3. Подозрительные находки уводите в профильный калькулятор.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "orads-0-incomplete",
    title: "O-RADS 0 / incomplete — когда не ставить категорию",
    description:
      "Почему при неполном исследовании аднексов нельзя «угадывать» O-RADS 1–5: incomplete / 0, что дописать в протокол и как вести себя в калькуляторе.",
    kind: "case",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      {
        label: "ACR O-RADS US",
        year: "2022",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
      },
      { label: "Калькулятор O-RADS US", href: "/tools/calc/rads/o-rads" },
      { label: "O-RADS за 2 минуты", href: "/blog/orads-adnexa-2-minutes" },
    ],
    related: [
      { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
      { href: "/blog/orads-adnexa-2-minutes", label: "Маршрут за 2 минуты" },
      { href: "/blog/iota-adnex-vs-orads", label: "IOTA vs O-RADS" },
      { href: "/tools/o-rads", label: "Комната O-RADS" },
    ],
    bodyMarkdown: `
## Клинический кейс (обезличенный)

Технически ограниченный осмотр: образование видно частично, солидный компонент и васкуляризация **не** оценены. Врач чувствует давление «поставить хоть какую-то категорию» для протокола.

## Правильный ход

1. Не угадывать O-RADS 2–5 без lexicon-признаков.
2. В [калькуляторе O-RADS](/tools/calc/rads/o-rads) отметить неполноту — модуль ведёт к **incomplete / O-RADS 0** по правилам ACR/продукта.
3. В протоколе явно написать, **чего не хватает** (доступ, боль, газ, размер поля).
4. Назначить дообследование / повторное УЗИ / МРТ по локальному маршруту.

## Почему это важно

Ложная «уверенная» категория хуже честного incomplete: коллега и пациентка получают ложное чувство завершённости.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "fmf-first-trimester-not-screening",
    title: "FMF / I триместр — что не путать со скринингом",
    description:
      "Консультант FMF в SonoGyn Pro помогает структурировать вопросы I триместра. Это CDS для врача, не замена сертифицированного скрининга и локального маршрута.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "The Fetal Medicine Foundation", href: "https://fetalmedicine.org/" },
      { label: "ISUOG guidelines", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
      { label: "Консультант FMF в SonoGyn Pro", href: "/ai/consultants/fmf" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
    ],
    related: [
      { href: "/ai/consultants/fmf", label: "FMF · консультант" },
      { href: "/tools/calc/ob/fetometry", label: "Фетометрия" },
      { href: "/tools/calc/ob/fetal-weight", label: "EFW" },
      { href: "/blog/efw-hadlock-limits", label: "Ограничения EFW" },
    ],
    bodyMarkdown: `
## Что это не есть

Модуль [/ai/consultants/fmf](/ai/consultants/fmf) — **справочный ассистент** для специалиста. Он **не**:

- не выдаёт сертификат FMF;
- не заменяет программный скрининг I триместра в аккредитованном центре;
- не считает риск «вместо лаборатории и ПО скрининга».

## Когда уместен

- Разбор клинического вопроса по беременности / I триместру в кабинете.
- Связка с фетометрией и чек-листами после УЗИ.
- Обучение ординаторов: структура рассуждения, не «ответ пациенту».

## Практика

1. Откройте консультанта FMF.
2. Сформулируйте вопрос врача (без ПДн пациента в чате, если политика центра запрещает).
3. Сверьте вывод с КР / ISUOG и локальным маршрутом скрининга.
4. В протокол — только то, что подтверждено исследованием и регламентом.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "elastography-when-to-use",
    title: "Elastography: когда модуль уместен",
    description:
      "Эластография в SonoGyn Pro — структурированный ввод и справочный вывод. Не замена экспертизы и не источник выдуманных kPa из блога.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Калькулятор эластографии", href: "/tools/calc/gyn/elastography" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
      { label: "ISUOG guidelines", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    ],
    related: [
      { href: "/tools/calc/gyn/elastography", label: "Эластография" },
      { href: "/tools/calc/gyn", label: "Хаб гинекологии" },
      { href: "/tools/calc/rads/ti-rads", label: "TI-RADS" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Когда открывать модуль

- Есть **корректная** запись эластографии с аппарата (метод и единицы — как в протоколе).
- Нужно структурировать ввод для черновика заключения.
- Обучение: понять, какие поля обязательны в вашем центре.

## Когда не открывать «для красоты»

- Нет сырых данных с аппарата — не подставляйте числа из памяти/блога.
- Метод центра не совпадает с полями модуля — зафиксируйте ограничение в протоколе.

## Маршрут

1. [/tools/calc/gyn/elastography](/tools/calc/gyn/elastography)
2. Внесите параметры **как на аппарате**.
3. Прочитайте справочный вывод — CDS.
4. Пороги и тактика — в КР / локальном протоколе и в самом модуле, не в этой статье.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "colposcopy-protocol-fields",
    title: "Colposcopy protocol — поля без диагноза",
    description:
      "Как заполнить протокол кольпоскопии в калькуляторе: признаки и структура отчёта. Диагноз CIN/рака ставит клиницист, не форма.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Калькулятор кольпоскопии", href: "/tools/calc/gyn/colposcopy" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
    ],
    related: [
      { href: "/tools/calc/gyn/colposcopy", label: "Кольпоскопия" },
      { href: "/tools/calc/gyn/cin-risk", label: "Риск CIN" },
      { href: "/tools/calc/gyn/cervical-intelligence", label: "Шейка · разбор" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Цель модуля

[/tools/calc/gyn/colposcopy](/tools/calc/gyn/colposcopy) помогает **собрать поля протокола** (зона трансформации, признаки, биопсия — по шагам модуля). Это не гистологический диагноз.

## Рабочий порядок

1. Откройте калькулятор до или сразу после осмотра.
2. Зафиксируйте видимость ЗТ и lexicon-признаки, которые видите.
3. Не «дорисовывайте» то, чего не было в поле зрения.
4. Свяжите с цитологией / HPV в соседних модулях при необходимости.
5. Заключение и маршрут — по КР и решению гинеколога.

## Чего нет в статье

Пороги «обязательной биопсии» и staging — только в КР и клинике.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "ln-rads-lexicon",
    title: "LN-RADS: lexicon лимфоузлов",
    description:
      "Структурированное описание лимфоузлов на УЗИ в логике LN-RADS: признаки в калькуляторе, без смешения с TI-RADS/BI-RADS.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Калькулятор LN-RADS", href: "/tools/calc/rads/ln-rads" },
      {
        label: "ACR Reporting and Data Systems (семейство RADS)",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems",
      },
    ],
    related: [
      { href: "/tools/calc/rads/ln-rads", label: "LN-RADS" },
      { href: "/tools/calc/rads/ti-rads", label: "TI-RADS" },
      { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
      { href: "/blog/tirads-lexicon-3-minutes", label: "TI-RADS за 3 минуты" },
    ],
    bodyMarkdown: `
## Отдельная рамка

LN-RADS описывает **лимфоузлы**. Не складывайте баллы с TI-RADS или BI-RADS — разные lexicon.

## Маршрут

1. Откройте [/tools/calc/rads/ln-rads](/tools/calc/rads/ln-rads).
2. Отметьте признаки узла по шагам модуля.
3. Перенесите формулировки в протокол с явным указанием системы (LN-RADS).
4. Тактику (FNA, наблюдение) — с клиницистом и локальным алгоритмом.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "pregnancy-medications-reference-only",
    title: "Pregnancy medications — только справочная рамка",
    description:
      "Модуль лекарств при беременности в SonoGyn Pro — CDS-справочник для врача. Не рецепт, не замена инструкции и клинического решения.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Аптека беременности в SonoGyn Pro", href: "/tools/calc/ob/pregnancy-medications" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
      { label: "Государственный реестр ЛС (ориентир)", href: "https://grls.rosminzdrav.ru/" },
    ],
    related: [
      { href: "/tools/calc/ob/pregnancy-medications", label: "Лекарства при беременности" },
      { href: "/tools/pharmacy", label: "Хаб аптеки" },
      { href: "/ai/consultants/fmf", label: "FMF · консультант" },
      { href: "/tools/calc", label: "Каталог" },
    ],
    bodyMarkdown: `
## Жёсткие границы

[/tools/calc/ob/pregnancy-medications](/tools/calc/ob/pregnancy-medications):

- **не** выписывает рецепт;
- **не** заменяет инструкцию по применению и консультацию клинического фармаколога;
- показывает справочный контекст для обсуждения врачом.

## Практика

1. Уточните срок и показание клинически.
2. Откройте модуль как шпаргалку структуры вопроса.
3. Сверьте с КР, GRLS и актуальной инструкцией ЛС.
4. Решение о назначении — только у лечащего врача.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "adnex-fields-before-model",
    title: "ADNEX: какие поля собрать до модели",
    description:
      "Чек-лист предикторов перед IOTA ADNEX в SonoGyn Pro. Без полного набора модель ограничена — не заполняйте пустые поля «на глаз».",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "IOTA Group", href: "https://www.iotagroup.org/" },
      { label: "Калькулятор IOTA", href: "/tools/calc/rads/iota" },
      { label: "IOTA vs O-RADS", href: "/blog/iota-adnex-vs-orads" },
    ],
    related: [
      { href: "/tools/calc/rads/iota", label: "IOTA ADNEX / LR2" },
      { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
      { href: "/blog/iota-adnex-vs-orads", label: "Что выбрать" },
      { href: "/blog/orads-0-incomplete", label: "O-RADS incomplete" },
    ],
    bodyMarkdown: `
## До нажатия «рассчитать»

Соберите то, что требует выбранная модель в [/tools/calc/rads/iota](/tools/calc/rads/iota):

| Блок | Зачем |
|---|---|
| Возраст / онкоцентр | Предикторы ADNEX |
| Максимальный диаметр | УЗИ-измерение |
| Солидная ткань / папиллярные разрастания | Морфология |
| Камеры, асцит | Как в протоколе IOTA |
| CA-125 | Если модель/центр использует |

Точный список полей — **на экране калькулятора**. Статья не дублирует формулы и cut-off.

## Если поля нет

Не выдумывайте. Выберите другую модель (Simple Rules / LR2) или сначала O-RADS lexicon, либо дообследуйте.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "open-access-vs-register",
    title: "Open access кабинет vs регистрация",
    description:
      "Что даёт открытый вход в кабинет SonoGyn Pro и зачем регистрация: кейсы, PRO, сохранение прогресса — без путаницы для врача.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Кабинет", href: "/home" },
      { label: "Регистрация", href: "/register" },
      { label: "Тарифы", href: "/pricing" },
      { label: "Политика конфиденциальности", href: "/privacy" },
    ],
    related: [
      { href: "/home", label: "Кабинет" },
      { href: "/register", label: "Регистрация" },
      { href: "/pricing", label: "Тарифы" },
      { href: "/blog", label: "Блог" },
    ],
    bodyMarkdown: `
## Два режима

| | Open access / демо | После регистрации |
|---|---|---|
| Калькуляторы и справочники | Обычно доступны | Доступны |
| Сохранение кейсов, профиль | Ограничено / нет | Да |
| PRO / квоты AI | По политике пилота | По тарифу |
| Аудит согласий / ПДн | Минимальный | Полный контур аккаунта |

Точный статус пилота смотрите на [/pricing](/pricing) и экране входа — он может меняться env-флагами.

## Кому хватает кабинета без аккаунта

- Быстрый расчёт на приёме (O-RADS, Bishop, EFW…).
- Знакомство с продуктом.

## Когда регистрироваться

- Нужны кейсы, прогресс обучения, PRO.
- Работа в команде / долгий пилот.

Старт: [/home](/home) или [/register](/register).

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "pwa-what-works-offline",
    title: "PWA: что доступно offline",
    description:
      "Установка SonoGyn Pro на рабочий стол: какие калькуляторы удобны без сети, а чат и AI — только online.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Кабинет / PWA", href: "/home" },
      { label: "Каталог калькуляторов", href: "/tools/calc" },
    ],
    related: [
      { href: "/home", label: "Кабинет" },
      { href: "/tools/calc", label: "Калькуляторы" },
      { href: "/blog/open-access-vs-register", label: "Open access vs регистрация" },
      { href: "/pricing", label: "Тарифы" },
    ],
    bodyMarkdown: `
## Зачем PWA врачу

Ярлык на планшете / рабочем столе: быстрее открыть калькулятор между пациентами.

## Offline vs online (ориентир)

| Работает удобнее offline / на слабой сети | Только online |
|---|---|
| Уже открытые экраны калькуляторов (после кеша) | AI-чат, консультанты |
| Справочные страницы из кеша | Синхронизация кейсов, оплата |
| | Новые загрузки атласов / обновления |

Точный список кеша зависит от визитов и версии SW — не обещаем «весь продукт offline».

## Практика

1. Откройте [/home](/home) online хотя бы раз.
2. Примите предложение «Установить», если браузер показывает.
3. Для AI и сохранения кейсов нужна сеть.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "quiz-self-check-disclaimer",
    title: "Самопроверка / quiz — дисклеймер экзамена",
    description:
      "Quiz-хаб SonoGyn Pro для самопроверки врача и ординатора. Не официальный экзамен НМО и не допуск к практике.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Quiz-хаб", href: "/tools/refs/quiz-hub" },
      { label: "Образовательная библиотека", href: "/tools/refs" },
    ],
    related: [
      { href: "/tools/refs/quiz-hub", label: "Quiz-хаб" },
      { href: "/tools/refs", label: "Справочники" },
      { href: "/blog/career-ladder-student-to-doctor", label: "Career ladder" },
      { href: "/blog", label: "Блог" },
    ],
    bodyMarkdown: `
## Что это

[/tools/refs/quiz-hub](/tools/refs/quiz-hub) и связанные квизы — **самопроверка** и обучение. Результат:

- не зачёт НМО;
- не сертификат допуска;
- не основание для клинического решения у пациента.

## Как пользоваться

1. Выберите банк вопросов по теме.
2. Разберите ошибки по гайдлайну / КР, не по памяти чата.
3. Вернитесь к калькулятору темы (O-RADS, миома, RCOG…), если есть пробел в методике.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "career-ladder-student-to-doctor",
    title: "Career ladder: студент → врач в продукте",
    description:
      "Как SonoGyn Pro ведёт от знакомства с калькуляторами к рабочему кабинету и PRO: ступени без подмены реального ординаторского пути.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Лендинг / карьера в продукте", href: "/" },
      { label: "Кабинет", href: "/home" },
      { label: "Регистрация", href: "/register" },
      { label: "PRO / тарифы", href: "/pricing" },
    ],
    related: [
      { href: "/", label: "Лендинг" },
      { href: "/home", label: "Кабинет" },
      { href: "/blog/quiz-self-check-disclaimer", label: "Quiz · дисклеймер" },
      { href: "/blog/open-access-vs-register", label: "Open access" },
    ],
    bodyMarkdown: `
## Ступени в продукте (не в дипломе)

| Ступень | Фокус в SonoGyn Pro |
|---|---|
| Знакомство | Калькуляторы, блог, open access [/home](/home) |
| Самопроверка | [/tools/refs/quiz-hub](/tools/refs/quiz-hub), справочники |
| Рабочий кабинет | Кейсы, протоколы после [/register](/register) |
| PRO | Расширенные квоты — [/pricing](/pricing) |

Это **продуктовая** лестница. Ординатура, аккредитация и НМО остаются вне приложения.

## Практический совет

Студенту: начните с O-RADS / чек-листов и quiz.  
Врачу на приёме: ярлык PWA + нужный калькулятор.  
Клинике: единый аккаунт и понятный тариф.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "vascular-us-consultant-scope",
    title: "Vascular US consultant — рамки",
    description:
      "Консультант по сосудистому УЗИ в SonoGyn Pro: справочная поддержка для специалиста, не замена ангиолога и не протокол «из чата».",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Консультант Vascular US", href: "/ai/consultants/vascular" },
      { label: "AI-консультанты", href: "/ai/consultants" },
      { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
    ],
    related: [
      { href: "/ai/consultants/vascular", label: "Vascular US" },
      { href: "/ai/consultants", label: "Консультанты" },
      { href: "/blog/fmf-first-trimester-not-screening", label: "FMF · рамки" },
      { href: "/tools/calc", label: "Калькуляторы" },
    ],
    bodyMarkdown: `
## Что внутри рамки

[/ai/consultants/vascular](/ai/consultants/vascular) помогает структурировать вопросы по сосудистому УЗИ для **врача**. Это CDS-чат, не направление на операцию и не отчёт страховщику.

## Чего нет

- Не ставит диагноз тромбоза / стеноза «по переписке».
- Не заменяет полный протокол УЗДГ и клинику.
- Не публикуем здесь числовые cut-off скоростей — только в гайдлайне / модуле при наличии.

## Практика

1. Сформулируйте вопрос специалиста без лишних ПДн.
2. Сверьте ответ с КР и локальным протоколом.
3. В заключение аппарата — только измеренное вами.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "evidence-assistant-vs-guideline",
    title: "Evidence assistant vs гайдлайн",
    description:
      "Чем evidence-ассистент отличается от чтения КР/ISUOG: быстрый обзор цитат vs обязательный первоисточник для решения у пациента.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Evidence", href: "/tools/refs/evidence" },
      { label: "Evidence assistant", href: "/tools/refs/evidence-assistant" },
      { label: "КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
      { label: "ISUOG guidelines", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    ],
    related: [
      { href: "/tools/refs/evidence", label: "Evidence" },
      { href: "/tools/refs/evidence-assistant", label: "Evidence assistant" },
      { href: "/tools/refs/guidelines", label: "Гайдлайны" },
      { href: "/blog", label: "Блог" },
    ],
    bodyMarkdown: `
## Два инструмента

| | Evidence / assistant | Гайдлайн / КР |
|---|---|---|
| Скорость | Быстрый обзор | Медленнее, но авторитетнее |
| Роль | Подсказка, навигация по источникам | Основа тактики |
| Риск | Галлюцинации / устаревший сниппет | Нужна актуальная редакция |

## Правило для приёма

1. Ассистент — чтобы **найти**, что читать.
2. Решение у пациентки — только после сверки с КР / ISUOG / локальным протоколом.
3. Не копируйте ответ чата в протокол как «заключение по evidence».

Модули: [/tools/refs/evidence](/tools/refs/evidence), [/tools/refs/evidence-assistant](/tools/refs/evidence-assistant).

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "appointment-hub-on-shift",
    title: "Appointment hub на приёме",
    description:
      "Один экран для смены: срок, EFW, Bishop, VBAC и соседние калькуляторы — без прыжков по меню.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Быстрый доступ на приёме", href: "/tools/calc/appointment" },
      { label: "Каталог калькуляторов", href: "/tools/calc" },
    ],
    related: [
      { href: "/tools/calc/appointment", label: "Appointment hub" },
      { href: "/tools/calc/ob/bishop", label: "Bishop" },
      { href: "/tools/calc/ob/vbac", label: "VBAC" },
      { href: "/blog/pwa-what-works-offline", label: "PWA offline" },
    ],
    bodyMarkdown: `
## Зачем хаб

На потоке родовспоможения / УЗИ ОМТ удобнее один ярлык, чем десять пунктов меню.

## Что открыть

[/tools/calc/appointment](/tools/calc/appointment) — быстрый доступ к типичным расчётам смены (срок, масса, Bishop, VBAC и др. по составу экрана).

## Совет

1. Поставьте PWA на планшет (см. [статью про offline](/blog/pwa-what-works-offline)).
2. Закрепите appointment hub в избранном браузера.
3. Числовые пороги — только в модулях, не «с хаба наизусть».

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "telegram-channel-vs-product",
    title: "Telegram-канал vs продукт",
    description:
      "Канал в Telegram — новости и сообщество. Клинические расчёты, кейсы и PRO — только в SonoGyn Pro web/PWA.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Лендинг SonoGyn Pro", href: "/" },
      { label: "Кабинет", href: "/home" },
      { label: "Политика конфиденциальности", href: "/privacy" },
    ],
    related: [
      { href: "/", label: "Лендинг" },
      { href: "/home", label: "Кабинет" },
      { href: "/blog/open-access-vs-register", label: "Open access" },
      { href: "/contacts", label: "Контакты" },
    ],
    bodyMarkdown: `
## Разделение ролей

| Telegram-канал | Продукт (web / PWA) |
|---|---|
| Анонсы, короткие разборы | Калькуляторы, кейсы, AI |
| Ссылки на статьи блога | Сохранение прогресса / PRO |
| Обсуждение коллег (если есть чат) | Аудит согласий, кабинет |

Ссылка на канал — в футере лендинга (компонент Telegram). В РФ для Telegram иногда нужен VPN — это ограничение сети, не продукта.

## Нельзя

- Считать O-RADS / Bishop «в комментариях канала».
- Присылать ПДн пациентов в публичный Telegram.

Рабочий контур: [/home](/home).

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "dark-light-a11y-for-doctors",
    title: "Dark/light a11y для врача",
    description:
      "Светлая и тёмная тема в кабинете: контраст, focus, reduced motion. Как не потерять дисклеймеры и статус ошибки на смене.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Кабинет", href: "/home" },
      { label: "Каталог калькуляторов", href: "/tools/calc" },
    ],
    related: [
      { href: "/home", label: "Кабинет" },
      { href: "/tools/calc", label: "Калькуляторы" },
      { href: "/blog/appointment-hub-on-shift", label: "Appointment hub" },
      { href: "/blog", label: "Блог" },
    ],
    bodyMarkdown: `
## Зачем врачу тема

Ночная смена / тёмный кабинет УЗИ — тёмная тема снижает блик. Дневной приём — светлая. Переключатель в шапке кабинета (theme).

## A11y-правила продукта (кратко)

- Статус ошибки/успеха **не только цветом**.
- Focus с клавиатуры виден.
- Тяжёлая анимация уважает \`prefers-reduced-motion\`.
- Медицинские дисклеймеры читаемы в обеих темах.

## Практика на смене

1. Выберите тему до потока пациентов.
2. Проверьте, что дисклеймер CDS на экране калькулятора читается.
3. Не полагайтесь на «красный = плохо» без текста.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "cookie-consent-analytics-clinic",
    title: "Cookie consent / аналитика для клиники",
    description:
      "Какие cookies нужны для входа, что такое аналитика после согласия, и чего клиника не должна ждать от Метрики без ID и consent.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Документация analytics", href: "/blog" },
      { label: "Лендинг", href: "/" },
    ],
    related: [
      { href: "/privacy", label: "Политика" },
      { href: "/offer", label: "Оферта" },
      { href: "/contacts", label: "Контакты" },
      { href: "/blog/open-access-vs-register", label: "Регистрация" },
    ],
    bodyMarkdown: `
## Два слоя

| Необходимые | Аналитические |
|---|---|
| Сессия входа, безопасность | Яндекс.Метрика / GA / Firebase — **после согласия** |
| Без баннера «можно жить» | Баннер + «Настройки cookie» в футере |

До согласия сетевых запросов к счётчикам нет. Без \`NEXT_PUBLIC_YM_ID\` / \`GA_ID\` скрипты не грузятся.

## Для главврача / IT клиники

- Воронка «визит → регистрация → расчёт» появляется только после настройки ID и согласия пользователей.
- В аналитику **не** уходят поля калькуляторов и ПДн пациентов (продуктовое правило).
- Подробности для команды разработки — \`docs/analytics.md\` в репозитории.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "offer-in-one-minute",
    title: "Юридические страницы: оферта за 1 минуту",
    description:
      "Где читать оферту, политику и контакты оператора. Черновики для публикации — финальную редакцию проверяет юрист.",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Публичная оферта", href: "/offer" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Контакты", href: "/contacts" },
      { label: "Условия", href: "/terms" },
    ],
    related: [
      { href: "/offer", label: "Оферта" },
      { href: "/privacy", label: "Политика" },
      { href: "/contacts", label: "Контакты" },
      { href: "/register", label: "Регистрация" },
    ],
    bodyMarkdown: `
## За 60 секунд

1. [/offer](/offer) — условия сервиса и PRO.
2. [/privacy](/privacy) — ПДн и cookies.
3. [/contacts](/contacts) — как связаться с поддержкой / оператором.
4. На регистрации отметьте согласие с Политикой и Офертой.

## Важно

Тексты могут быть помечены как черновик до юр. ревью. Реквизиты юрлица подставляются из env — если их нет, на странице это видно явно (не выдумываем ИНН в блоге).

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "contacts-support-sla",
    title: "Contacts / support SLA",
    description:
      "Куда писать по продукту и пилоту. Ожидания по ответу поддержки без ложных обещаний «24/7 врача на линии».",
    kind: "how-to",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Контакты", href: "/contacts" },
      { label: "Оферта", href: "/offer" },
    ],
    related: [
      { href: "/contacts", label: "Контакты" },
      { href: "/offer", label: "Оферта" },
      { href: "/pricing", label: "Тарифы" },
      { href: "/blog/telegram-channel-vs-product", label: "Telegram vs продукт" },
    ],
    bodyMarkdown: `
## Куда писать

Актуальный email и форма — на [/contacts](/contacts). Канал Telegram — для новостей, не для срочной клинической консультации по вашей пациентке.

## Чего ждать

- Ответ по доступу / тарифу / багу — в рабочие дни (точные сроки — в оферте / ответе поддержки).
- **Не** обещаем экстренную клиническую помощь через support.
- Для пилота клиники заранее согласуйте контакт координатора.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "staging-vs-production-pilot",
    title: "Staging vs production для пилота",
    description:
      "Чем preview/staging отличается от production SonoGyn Pro: данные, оплата, open access. Что проверить перед пилотом отделения.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Лендинг production", href: "/" },
      { label: "Тарифы", href: "/pricing" },
      { label: "Оферта", href: "/offer" },
    ],
    related: [
      { href: "/pricing", label: "Тарифы" },
      { href: "/blog/open-access-vs-register", label: "Open access" },
      { href: "/contacts", label: "Контакты" },
      { href: "/blog", label: "Блог" },
    ],
    bodyMarkdown: `
## Коротко

| | Staging / preview | Production |
|---|---|---|
| URL | \`*.vercel.app\` / ветка | Канонический домен продукта |
| Данные | Тестовые, могут сбрасываться | Рабочие (с RLS) |
| Оплата | Часто выключена / test keys | ЮKassa/Stripe по env |
| Open access | Может быть шире для демо | Политика пилота |

## Чек-лист перед пилотом отделения

1. Открываете **production**-URL, не preview.
2. Регистрация и согласие с офертой работают.
3. Нужные калькуляторы открываются под вашим аккаунтом.
4. Оплата PRO — только если так задумано пилотом ([/pricing](/pricing)).
5. Не вносите реальных ПДн на staging.

## Дисклеймер

${CLINICAL_CONTENT_DISCLAIMER}
`.trim(),
  },
  {
    slug: "mobile-expo-parity-calculators",
    title: "Mobile Expo parity калькуляторов",
    description:
      "Web и мобильное приложение SonoGyn Pro делят логику калькуляторов. Где смотреть одинаковый расчёт и чего ждать от parity.",
    kind: "guideline",
    publishedAt: "2026-11-13",
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
    sources: [
      { label: "Каталог web", href: "/tools/calc" },
      { label: "O-RADS US web", href: "/tools/calc/rads/o-rads" },
      { label: "Лендинг", href: "/" },
    ],
    related: [
      { href: "/tools/calc", label: "Каталог" },
      { href: "/tools/calc/rads/o-rads", label: "O-RADS" },
      { href: "/blog/pwa-what-works-offline", label: "PWA" },
      { href: "/blog/open-access-vs-register", label: "Аккаунт" },
    ],
    bodyMarkdown: `
## Принцип monorepo

Клинические формулы живут в \`packages/*\` (например O-RADS). Web (\`apps/web\`) и mobile (\`apps/mobile\`, Expo) — **оболочки**. Значимые калькуляторы должны совпадать по смыслу расчёта.

## Что это значит для врача

- Один аккаунт — те же кейсы и прогресс (где включено).
- PWA на планшете ≈ web; нативное Expo — отдельная установка из стора/пилота.
- Если UI на mobile ещё догоняет web — смотрите web/PWA для полного каталога.

## Практика

1. Критичный расчёт на приёме — web/PWA с актуальным деплоем.
2. Расхождение web vs mobile — пишите в [/contacts](/contacts) с названием калькулятора.
3. Не сравнивайте со скринами старых сборок.

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
