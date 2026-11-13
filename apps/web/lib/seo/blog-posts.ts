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
];

const bySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

export function getBlogPost(slug: string): BlogPost | undefined {
  return bySlug.get(slug);
}

export function listBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
