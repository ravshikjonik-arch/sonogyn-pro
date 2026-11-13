import { CLINICAL_CONTENT_REVIEWER } from "@/lib/seo/clinical-reviewer";

export type CalculatorSource = {
  label: string;
  year?: string;
  href?: string;
};

export type CalculatorFaqItem = {
  question: string;
  answer: string;
};

export type CalculatorLandingContent = {
  path: string;
  h1: string;
  lead: string;
  howItWorks: string[];
  sources: CalculatorSource[];
  limitations: string[];
  example: {
    title: string;
    body: string;
  };
  faq: CalculatorFaqItem[];
  related: { href: string; label: string }[];
  updatedAt: string; // ISO date YYYY-MM-DD
  reviewedBy: typeof CLINICAL_CONTENT_REVIEWER;
};

/**
 * Посадочный SEO-контент. Пороги и цифры — только через сам калькулятор / гайдлайн;
 * здесь — маршрут работы врача и официальные ссылки, без выдуманных cut-off.
 */
export const CALCULATOR_LANDING_CONTENT: CalculatorLandingContent[] = [
  {
    path: "/tools/calc/rads/o-rads",
    h1: "Калькулятор O-RADS US (ACR v2022)",
    lead:
      "Пошаговая стратификация аднексальных образований на УЗИ по ACR O-RADS US v2022 для врачей УЗД и акушеров-гинекологов. Помогает зафиксировать категорию и черновик протокола; заключение всегда за лечащим врачом.",
    howItWorks: [
      "Укажите клинический контекст (возраст / менопаузальный статус) и доступность полного описания образования.",
      "Отметьте морфологию: кистозное / солидное, камеры, перегородки, солидный компонент, васкуляризация.",
      "Калькулятор сопоставляет признаки с правилами O-RADS US v2022 и предлагает категорию 0–5 либо статус «недостаточно данных».",
      "При необходимости сравните с IOTA (Simple Rules / ADNEX) в связанных инструментах — без подмены одной системы другой.",
    ],
    sources: [
      {
        label: "ACR O-RADS US v2022 — American College of Radiology",
        year: "2022",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
      },
      {
        label: "IOTA — International Ovarian Tumor Analysis (сопутствующие модели)",
        href: "https://www.iotagroup.org/",
      },
    ],
    limitations: [
      "Не заменяет полный протокол УЗИ и клинико-лабораторную корреляцию.",
      "При технически неполном исследовании категория злокачественности не «угадывается» — используется O-RADS 0 / incomplete.",
      "Тактика (наблюдение / МРТ / хирургия) — по локальному маршруту и решению гинеколога-онколога.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Пременопауза, однокамерная анэхогенная киста без солидного компонента и без васкуляризации перегородок. Врач проходит шаги калькулятора и сверяет предложенную категорию classic benign / низкий риск с полным описанием в протоколе. Цифры размеров и итоговая категория — только из расчёта на экране, не из этого текста.",
    },
    faq: [
      {
        question: "Это диагноз рака яичника?",
        answer:
          "Нет. O-RADS — система стратификации риска по УЗИ-признакам. Диагноз и тактика — у клинициста.",
      },
      {
        question: "Нужны ли три размера образования?",
        answer:
          "В продукте SonoGyn Pro для финальной категории обычно требуются три измерения; иначе результат помечается как неполный.",
      },
      {
        question: "Чем O-RADS отличается от IOTA?",
        answer:
          "O-RADS US — ACR lexicon и категории 0–5. IOTA — отдельные модели (Simple Rules, ADNEX, LR2). Их можно сопоставлять, но не смешивать в один «балл».",
      },
      {
        question: "Можно ли использовать без входа?",
        answer:
          "Демо-доступ к калькуляторам открыт; сохранение кейсов и расширенные квоты — после входа / PRO.",
      },
    ],
    related: [
      { href: "/tools/calc/rads/iota", label: "IOTA ADNEX / LR2" },
      { href: "/tools/o-rads", label: "Комната O-RADS (калькулятор + атлас)" },
      { href: "/blog/orads-adnexa-2-minutes", label: "O-RADS за 2 минуты" },
      { href: "/blog/orads-0-incomplete", label: "O-RADS 0 / incomplete" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/rads/bi-rads",
    h1: "Калькулятор BI-RADS US",
    lead:
      "Структурированная оценка образований молочной железы на УЗИ в логике ACR BI-RADS. Помогает собрать признаки и категорию для протокола; интерпретация — за врачом УЗД / маммологом.",
    howItWorks: [
      "Выберите признаки образования: форма, края, эхогенность, ориентация, задний акустический эффект, васкуляризация.",
      "Калькулятор собирает lexicon и предлагает ориентир категории BI-RADS US.",
      "Сверьте с клиникой, маммографией/МРТ и локальным алгоритмом маршрутизации.",
    ],
    sources: [
      {
        label: "ACR BI-RADS Atlas — Ultrasound",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/BI-RADS",
      },
    ],
    limitations: [
      "Не заменяет полный маммологический маршрут и гистологическую верификацию.",
      "Категория на УЗИ может отличаться от маммографии / МРТ — фиксируйте модальность.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Очаг в молочной железе с описанными lexicon-признаками. Врач отмечает признаки в калькуляторе и переносит согласованную категорию в протокол УЗИ МЖ.",
    },
    faq: [
      {
        question: "Подходит ли для скрининга населения?",
        answer:
          "Инструмент для структурирования описания врачом. Скрининговые программы определяются национальными и локальными регламентами.",
      },
      {
        question: "Связан ли модуль с BI-RADS маммографии?",
        answer: "Фокус страницы — УЗИ (US). Маммографический BI-RADS — отдельная модальность.",
      },
      {
        question: "Что делать при BI-RADS 0?",
        answer: "Дообследование / сравнение с другими методами — по клиническому алгоритму, не «автоназначение» калькулятором.",
      },
      {
        question: "Есть ли связь с риском рака МЖ?",
        answer: "См. связанный калькулятор индивидуального риска — это другой контур, не подмена BI-RADS.",
      },
    ],
    related: [
      { href: "/blog/birads-us-vs-mammography", label: "BI-RADS US vs маммография" },
      { href: "/tools/calc/rads/ti-rads", label: "TI-RADS" },
      { href: "/tools/calc/gyn/breast-risk", label: "Риск рака МЖ" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/rads/ti-rads",
    h1: "Калькулятор TI-RADS ACR",
    lead:
      "Оценка узлов щитовидной железы на УЗИ по ACR TI-RADS: scoring признаков, уровень TR и ориентиры к FNA. Для врачей УЗД и эндокринологов; решение о биопсии — клиническое.",
    howItWorks: [
      "Отметьте lexicon-признаки узла (состав, эхогенность, форма, края, очаги).",
      "Калькулятор суммирует баллы и показывает уровень TR с рекомендацией по FNA в логике ACR.",
      "Учтите размер узла и клинический контекст — пороги FNA берутся из актуального ACR TI-RADS, не из текста страницы.",
    ],
    sources: [
      {
        label: "ACR TI-RADS",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/TI-RADS",
      },
    ],
    limitations: [
      "Не заменяет цитологию / молекулярные тесты и эндокринологический осмотр.",
      "Мультифокальность и шейные ЛУ требуют отдельного описания.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Солидный гипоэхогенный узел. Врач вносит признаки в калькулятор, получает TR-уровень и сверяет показания к FNA с размером узла по ACR.",
    },
    faq: [
      {
        question: "Чем TI-RADS отличается от EU-TIRADS?",
        answer: "Разные системы. Этот модуль ориентирован на ACR TI-RADS; не смешивайте баллы разных шкал.",
      },
      {
        question: "Нужен ли допплер?",
        answer: "Васкуляризация учитывается в описании, но scoring ACR TI-RADS строится на lexicon-морфологии — см. шаги калькулятора.",
      },
      {
        question: "Можно ли ставить диагноз рака?",
        answer: "Нет. TI-RADS стратифицирует риск и маршрутизацию FNA, не ставит гистологический диагноз.",
      },
      {
        question: "Где смотреть LN?",
        answer: "Для лимфоузлов см. LN-RADS в каталоге.",
      },
    ],
    related: [
      { href: "/tools/calc/rads/ln-rads", label: "LN-RADS" },
      { href: "/blog/tirads-lexicon-3-minutes", label: "TI-RADS за 3 минуты" },
      { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/rads/iota",
    h1: "Калькулятор IOTA ADNEX / LR2",
    lead:
      "Вероятностные модели IOTA (ADNEX, LR2, Simple Rules) для аднексальных масс с возможностью сопоставления с O-RADS US. Поддержка решений, не замена экспертизы.",
    howItWorks: [
      "Выберите модель (Simple Rules / LR2 / ADNEX) и введите требуемые предикторы.",
      "Получите оценку вероятности / класс и сверьте с ультразвуковой картиной.",
      "При необходимости откройте O-RADS US для lexicon-категории ACR — системы дополняют, но не дублируют друг друга один в один.",
    ],
    sources: [
      { label: "IOTA Group", href: "https://www.iotagroup.org/" },
      {
        label: "ACR O-RADS US (сопоставление)",
        href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
      },
    ],
    limitations: [
      "Модели валидированы на определённых популяциях — осторожно при атипичном контексте.",
      "Онкомаркеры и МРТ интерпретируются отдельно.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Аднексальная масса с заполненными полями ADNEX. Врач получает модельный вывод и сопоставляет его с O-RADS-категорией в соседнем калькуляторе.",
    },
    faq: [
      {
        question: "Какую модель выбрать первой?",
        answer:
          "Зависит от доступных данных и привычки центра. Simple Rules — быстрый triage; ADNEX — при наличии полного набора предикторов.",
      },
      {
        question: "Заменяет ли IOTA O-RADS?",
        answer: "Нет. Это разные рамки; в SonoGyn Pro они связаны перекрёстными ссылками.",
      },
      {
        question: "Нужен ли CA-125?",
        answer: "Для части моделей — да. Если поля нет, калькулятор подскажет ограничение.",
      },
      {
        question: "Это для пациентов?",
        answer: "Нет. Инструмент для специалистов.",
      },
    ],
    related: [
      { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
      { href: "/blog/iota-adnex-vs-orads", label: "IOTA vs O-RADS" },
      { href: "/tools/calc/gyn/ovarian-cancer-risk", label: "Риск рака яичников" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/gyn/endometrium",
    h1: "Калькулятор эндометрия (M-эхо)",
    lead:
      "Ориентиры по толщине и структуре эндометрия на УЗИ с учётом фазы цикла и менопаузального статуса. Пороги и маршрутизация — в модуле и актуальных КР/ISUOG; страница объясняет, как пользоваться калькулятором.",
    howItWorks: [
      "Укажите статус (пре-/постменопауза), день цикла при необходимости и измеренное M-эхо.",
      "Отметьте очаговые изменения (полип, неоднородность и т.п.), если есть.",
      "Модуль сопоставляет ввод с заложенными клиническими ориентирами и формирует справочный вывод для протокола.",
    ],
    sources: [
      {
        label: "ISUOG — гинекологический ультразвук (practice guidelines)",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
      {
        label: "Рубрикатор клинических рекомендаций МЗ РФ",
        href: "https://cr.minzdrav.gov.ru/",
      },
    ],
    limitations: [
      "Числовые пороги зависят от контекста и редакции гайдлайна — сверяйте с калькулятором и КР, не с маркетинговым текстом.",
      "Кровотечение в постменопаузе требует клинического маршрута, а не только цифры M-эхо.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Постменопауза, измеренное M-эхо внесено в калькулятор. Врач читает справочный комментарий модуля и решает о дообследовании по клинике и КР.",
    },
    faq: [
      {
        question: "Какой «нормальный» мм эндометрия?",
        answer:
          "Единой цифры «для всех» нет. Ориентиры зависят от фазы и менопаузы — используйте калькулятор и актуальные КР.",
      },
      {
        question: "Нужен ли TV-доступ?",
        answer: "Для точного M-эхо обычно предпочтителен трансвагинальный доступ при возможности.",
      },
      {
        question: "Это замена гистероскопии?",
        answer: "Нет. УЗИ помогает отобрать пациенток; инвазивная верификация — по показаниям.",
      },
      {
        question: "Связь с FIGO AUB?",
        answer: "Классификация аномальных кровотечений — клиническая; калькулятор эндометрия — ультразвуковой контур.",
      },
    ],
    related: [
      { href: "/tools/calc/gyn/pop-q", label: "POP-Q" },
      { href: "/blog/endometrium-thickness-phases", label: "M-эхо: таблица маршрута" },
      { href: "/tools/refs/exam-checklists", label: "Чек-лист УЗИ ОМТ" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/ob/fetal-weight",
    h1: "Калькулятор массы плода (EFW)",
    lead:
      "Оценка предполагаемой массы плода по биометрии (BPD, HC, AC, FL и др.) с формулами семейства Hadlock и смежными. Для акушерского УЗИ; перцентили и тактика — с клинической корреляцией.",
    howItWorks: [
      "Введите биометрические параметры в мм (как в протоколе аппарата).",
      "Выберите формулу / профиль расчёта, доступный в модуле.",
      "Получите EFW и при наличии — сопоставление с нормативами; интерпретируйте вместе с динамикой роста и допплером.",
    ],
    sources: [
      {
        label: "ISUOG — practice guidelines (fetal biometry / growth)",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
    ],
    limitations: [
      "Ошибка EFW intrinsic; не используйте как единственный критерий родоразрешения.",
      "При подозрении на FGR смотрите допплер и динамику, не одну точку EFW.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "III триместр, введены BPD/HC/AC/FL. Врач получает EFW в граммах и сверяет с клиникой и предыдущими измерениями.",
    },
    faq: [
      {
        question: "Какая формула «правильная»?",
        answer: "Зависит от принятого в центре стандарта. Модуль показывает доступные варианты явно.",
      },
      {
        question: "Нужны ли перцентили?",
        answer: "Да для динамики роста — см. также нормы фетометрии и III триместровый чек-лист.",
      },
      {
        question: "Единицы ввода?",
        answer: "Миллиметры, как на аппарате УЗИ.",
      },
      {
        question: "Связь с Bishop / VBAC?",
        answer: "Это другие задачи родовспоможения — см. связанные калькуляторы.",
      },
    ],
    related: [
      { href: "/tools/calc/ob/fetometry", label: "Расчёт плода / фетометрия" },
      { href: "/blog/efw-hadlock-limits", label: "Ограничения EFW" },
      { href: "/tools/calc/ob/fetometry-norms", label: "Нормы фетометрии" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/ob/bishop",
    h1: "Шкала Bishop онлайн",
    lead:
      "Быстрый расчёт баллов зрелости шейки матки по шкале Bishop перед индукцией родов. Для акушеров; решение об индукции — клиническое.",
    howItWorks: [
      "Оцените раскрытие, сглаживание, положение, консистенцию шейки и станцию предлежащей части.",
      "Калькулятор суммирует баллы по классической шкале Bishop.",
      "Интерпретируйте сумму в контексте показаний к индукции и локального протокола.",
    ],
    sources: [
      {
        label: "Bishop EH. Pelvic scoring for elective induction (историческая шкала)",
        year: "1964",
      },
      {
        label: "Рубрикатор КР МЗ РФ (акушерство) — актуальные редакции",
        href: "https://cr.minzdrav.gov.ru/",
      },
    ],
    limitations: [
      "Модифицированные шкалы и локальные cut-off могут отличаться — уточняйте протокол МО.",
      "Не заменяет мониторинг плода и оценку таза.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Планируется индукция. Акушер вносит пять компонентов Bishop и получает сумму для записи в историю родов.",
    },
    faq: [
      {
        question: "Какой балл «достаточен» для индукции?",
        answer:
          "Пороги зависят от протокола МО и клинической ситуации — калькулятор считает сумму, не назначает индукцию.",
      },
      {
        question: "Нужно ли УЗИ?",
        answer: "Шкала клиническая; УЗИ шейки — отдельный контур (CL).",
      },
      {
        question: "Есть ли связь с VBAC?",
        answer: "VBAC/TOLAC — отдельный калькулятор риска/успеха.",
      },
      {
        question: "Можно ли считать на телефоне?",
        answer: "Да, модуль адаптивен; PWA ставится с рабочего стола.",
      },
    ],
    related: [
      { href: "/tools/calc/ob/vbac", label: "VBAC / TOLAC" },
      { href: "/blog/bishop-when-to-score", label: "Когда считать Bishop" },
      { href: "/tools/calc/ob/cervical-length", label: "Длина шейки (CL)" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/ob/vbac",
    h1: "Калькулятор VBAC / TOLAC",
    lead:
      "Оценка вероятности успешного vaginal birth after cesarean (VBAC) и факторов риска TOLAC. Для акушеров; согласие и маршрут — по локальным протоколам.",
    howItWorks: [
      "Введите акушерский анамнез и факторы, заложенные в модель модуля.",
      "Получите справочную оценку вероятности успеха / рисков.",
      "Обсудите с пациенткой в рамках информированного согласия и возможностей стационара.",
    ],
    sources: [
      {
        label: "Рубрикатор КР МЗ РФ — роды после кесарева / акушерство",
        href: "https://cr.minzdrav.gov.ru/",
      },
      {
        label: "ACOG — Vaginal Birth After Cesarean Delivery (международный ориентир)",
        href: "https://www.acog.org/",
      },
    ],
    limitations: [
      "Модель не учитывает все организационные факторы (анестезия, готовность к экстренному КС).",
      "Не заменяет очный консилиум при рубце на матке и осложнённом анамнезе.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Один рубец после КС в анамнезе, срок доношенный. Врач заполняет поля калькулятора и использует вывод как опору для беседы, не как приказ к TOLAC.",
    },
    faq: [
      {
        question: "Гарантирует ли высокий % успех VBAC?",
        answer: "Нет. Это вероятностная оценка, не гарантия.",
      },
      {
        question: "Два рубца — можно ли считать?",
        answer: "Следуйте локальному протоколу; модель может ограничить применимость.",
      },
      {
        question: "Связь со шкалой Bishop?",
        answer: "Bishop — зрелость шейки; VBAC — успех TOLAC. Разные вопросы.",
      },
      {
        question: "Нужен ли стационар 3 уровня?",
        answer: "Определяется маршрутизацией региона и риском — не выводом калькулятора.",
      },
    ],
    related: [
      { href: "/tools/calc/ob/bishop", label: "Шкала Bishop" },
      { href: "/blog/vbac-before-you-calculate", label: "VBAC: до расчёта" },
      { href: "/tools/calc/ob", label: "Хаб акушерских калькуляторов" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/calc/gyn/pop-q",
    h1: "Калькулятор POP-Q",
    lead:
      "Русскоязычный ввод точек POP-Q для описания опущения тазовых органов. Стандартизирует протокол осмотра; стадия и тактика — за гинекологом.",
    howItWorks: [
      "Введите измерения точек POP-Q (Aa, Ba, C, gh, pb, TVL, Ap, Bp, D) в см.",
      "Модуль отображает схему/стадию по правилам POP-Q.",
      "Зафиксируйте условия осмотра (натуживание, положение) в протоколе.",
    ],
    sources: [
      {
        label: "ICS / IUGA — POP-Q terminology (ориентир системы)",
        href: "https://www.ics.org/",
      },
    ],
    limitations: [
      "Не заменяет комплексную оценку тазового дна и уродинамику при показаниях.",
      "Сравнение «до/после» требует одинаковой методики измерения.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Пациентка с ощущением «выпадения». Врач вносит точки POP-Q и получает структурированное описание для истории болезни.",
    },
    faq: [
      {
        question: "В каких единицах вводить?",
        answer: "Сантиметры, как в классическом POP-Q.",
      },
      {
        question: "Нужно ли УЗИ?",
        answer: "POP-Q — клинический осмотр; УЗИ тазового дна — дополнение по показаниям.",
      },
      {
        question: "Это стадия пролапса?",
        answer: "Модуль помогает описать точки и стадию; клинический диагноз формулирует врач.",
      },
      {
        question: "Связь с эндометрием?",
        answer: "Другой контур — см. калькулятор эндометрия.",
      },
    ],
    related: [
      { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
      { href: "/blog/popq-measurement-points", label: "POP-Q: точки" },
      { href: "/tools/calc/gyn", label: "Хаб гинекологии" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
  {
    path: "/tools/refs/norms",
    h1: "Клинические нормы УЗИ",
    lead:
      "Справочник методик измерений и ориентиров для протоколов УЗИ в акушерстве и гинекологии. Используйте вместе с калькуляторами; цифры нормативов — в таблицах модуля и первоисточниках.",
    howItWorks: [
      "Выберите орган / параметр в справочнике.",
      "Сверьте методику измерения (срез, калиперы) с подсказками модуля.",
      "Перенесите значение в калькулятор (фетометрия, эндометрий, CL и т.д.) при необходимости.",
    ],
    sources: [
      {
        label: "ISUOG guidelines",
        href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
      },
      {
        label: "AIUM practice parameters",
        href: "https://www.aium.org/resources/practice-parameters",
      },
      {
        label: "Рубрикатор КР МЗ РФ",
        href: "https://cr.minzdrav.gov.ru/",
      },
    ],
    limitations: [
      "Таблицы могут отставать от новой редакции гайдлайна — проверяйте дату обновления и первоисточник.",
      "Не подменяет клинический контекст конкретного пациента.",
    ],
    example: {
      title: "Обезличенный сценарий",
      body:
        "Врач уточняет, как правильно измерить параметр, открывает карточку в справочнике и сверяет с измерением на аппарате.",
    },
    faq: [
      {
        question: "Это полная замена атласов?",
        answer: "Нет. Это рабочий справочник в кабинете рядом с калькуляторами.",
      },
      {
        question: "Есть ли чек-листы исследования?",
        answer: "Да — раздел exam-checklists (AIUM/ISUOG).",
      },
      {
        question: "Как предложить правку нормы?",
        answer: "Через support@sonogyn-pro.ru с указанием источника.",
      },
      {
        question: "Офлайн?",
        answer: "Часть калькуляторов доступна в PWA; актуальность норм лучше сверять онлайн.",
      },
    ],
    related: [
      { href: "/tools/refs/exam-checklists", label: "Чек-листы УЗИ" },
      { href: "/tools/calc/ob/fetometry-norms", label: "Нормы фетометрии" },
      { href: "/tools/calc", label: "Каталог калькуляторов" },
      { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
    ],
    updatedAt: "2026-11-13",
    reviewedBy: CLINICAL_CONTENT_REVIEWER,
  },
];

const byPath = new Map(CALCULATOR_LANDING_CONTENT.map((c) => [c.path, c]));

export function getCalculatorLandingContent(path: string): CalculatorLandingContent | undefined {
  return byPath.get(path);
}

export const POPULAR_CALCULATOR_LINKS = [
  { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
  { href: "/tools/calc/rads/iota", label: "IOTA ADNEX" },
  { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
  { href: "/tools/calc/rads/ti-rads", label: "TI-RADS" },
  { href: "/tools/calc/gyn/endometrium", label: "Эндометрий" },
  { href: "/tools/calc/ob/fetal-weight", label: "Масса плода (EFW)" },
  { href: "/tools/calc/ob/bishop", label: "Bishop" },
  { href: "/tools/calc/ob/vbac", label: "VBAC" },
] as const;
