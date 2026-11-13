import type { ClinicalGuideline } from "../types";

/** Каталог Green-top Guidelines (RCOG) — метаданные + УЗИ-ориентиры, без полного текста PDF. */
export const RCOG_BROWSE_URL =
  "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/";

export type RcogCategory =
  | "antenatal_us"
  | "early_pregnancy"
  | "preterm_cervix"
  | "gyn_us"
  | "labour";

export const RCOG_CATEGORY_LABELS: Record<RcogCategory, string> = {
  antenatal_us: "Антенатал · УЗИ",
  early_pregnancy: "Ранний срок",
  preterm_cervix: "Преждевременные · шейка",
  gyn_us: "Гинекология · УЗИ",
  labour: "Роды / острые",
};

/** Связь карточки RCOG → инструменты SonoGyn (обучение и приём). */
export type RcogSonogynLink = { label: string; href: string };

export const RCOG_SONOGYN_LINKS: Record<string, RcogSonogynLink[]> = {
  "rcog-gtg-31-sga": [
    { label: "FMF · III скрининг", href: "/ai/consultants/fmf?section=third" },
    { label: "Допплерометрия", href: "/ai/consultants/fmf?section=doppler" },
    { label: "Guided · по сроку", href: "/ai/consultants/fmf/guided" },
  ],
  "rcog-gtg-27a-previa-accreta": [
    { label: "FMF · II скрининг", href: "/ai/consultants/fmf?section=second" },
    { label: "Guided · морфология", href: "/ai/consultants/fmf/guided" },
  ],
  "rcog-gtg-27b-vasa": [
    { label: "FMF · II–III", href: "/ai/consultants/fmf?section=second" },
    { label: "Guided", href: "/ai/consultants/fmf/guided" },
  ],
  "rcog-gtg-57-rfm": [
    { label: "FMF · III", href: "/ai/consultants/fmf?section=third" },
    { label: "Помощник акушера", href: "/ai/consultants/obstetrics" },
  ],
  "rcog-gtg-51-twins": [
    { label: "FMF · скрининг", href: "/ai/consultants/fmf" },
    { label: "ISUOG Hub", href: "/tools/refs/isuog-guidelines" },
  ],
  "rcog-gtg-21-ectopic": [
    { label: "FMF · малый срок", href: "/ai/consultants/fmf?section=early" },
    { label: "Guided · early", href: "/ai/consultants/fmf/guided" },
  ],
  "rcog-gtg-17-recurrent-miscarriage": [
    { label: "FMF · малый срок", href: "/ai/consultants/fmf?section=early" },
  ],
  "rcog-gtg-75-cerclage": [
    { label: "Цервикометрия", href: "/ai/consultants/fmf?section=cervix" },
  ],
  "rcog-gtg-73-pprom": [
    { label: "Цервикометрия", href: "/ai/consultants/fmf?section=cervix" },
    { label: "Помощник акушера", href: "/ai/consultants/obstetrics" },
  ],
  "rcog-gtg-62-ovarian-premeno": [
    { label: "O-RADS US", href: "/tools/calc/rads/o-rads" },
    { label: "Хаб гинекологии", href: "/tools/gynecology" },
  ],
  "rcog-gtg-34-ovarian-postmeno": [
    { label: "O-RADS US", href: "/tools/calc/rads/o-rads" },
  ],
  "rcog-gtg-67-endometrial-hyperplasia": [
    { label: "Помощник гинеколога", href: "/ai/consultants/gynecology" },
    { label: "ISUOG endometrium", href: "/tools/refs/isuog-guidelines" },
  ],
};

export const RCOG_GUIDELINE_CATEGORY: Record<string, RcogCategory> = {
  "rcog-gtg-31-sga": "antenatal_us",
  "rcog-gtg-27a-previa-accreta": "antenatal_us",
  "rcog-gtg-27b-vasa": "antenatal_us",
  "rcog-gtg-57-rfm": "antenatal_us",
  "rcog-gtg-51-twins": "antenatal_us",
  "rcog-gtg-21-ectopic": "early_pregnancy",
  "rcog-gtg-17-recurrent-miscarriage": "early_pregnancy",
  "rcog-gtg-75-cerclage": "preterm_cervix",
  "rcog-gtg-73-pprom": "preterm_cervix",
  "rcog-gtg-62-ovarian-premeno": "gyn_us",
  "rcog-gtg-34-ovarian-postmeno": "gyn_us",
  "rcog-gtg-67-endometrial-hyperplasia": "gyn_us",
};

/**
 * Приоритетный набор для SonoGyn (УЗИ / АГ).
 * Полный каталог — на сайте RCOG; здесь карточки + crosswalk, не PDF.
 */
export const RCOG_GREEN_TOP_GUIDELINES: ClinicalGuideline[] = [
  {
    id: "rcog-gtg-31-sga",
    title: "RCOG · SGA / FGR — investigation and care (GTG 31)",
    summary:
      "Маловесный и задержка роста плода: обследование, допплер, тактика наблюдения. UK Green-top — ориентир рядом с ISUOG и КР РФ.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "prenatal",
    year: 2024,
    status: "active",
    documentNumber: "GTG No. 31",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "Green-top", "SGA", "FGR", "doppler"],
    sections: [
      {
        title: "Что смотреть на УЗИ",
        bullets: [
          "Фетометрия и EFW с перцентилями; динамика роста.",
          "Допплер UA / MCA / DV по показаниям; AFI / карман.",
          "Не подменяет КР РФ по ЗВУР — сверяйте локальный протокол ЛПУ.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-27a-previa-accreta",
    title: "RCOG · Placenta praevia and accreta (GTG 27a)",
    summary: "Предлежание и врастание плаценты: диагностика и менеджмент.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obstetrics",
    year: 2018,
    status: "active",
    documentNumber: "GTG No. 27a",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "placenta", "accreta", "previa"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Расстояние края плаценты до внутреннего зева; TV при сомнении.",
          "Признаки PAS: lacunae, myometrial thinning, bladder interface.",
          "Формулировки в протоколе — справочно; решение — мультидисциплинарно.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-27b-vasa",
    title: "RCOG · Vasa praevia (GTG 27b)",
    summary: "Ваза превиа: диагностика и тактика.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obstetrics",
    year: 2018,
    status: "active",
    documentNumber: "GTG No. 27b",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "vasa praevia", "cord"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Сосуды поверх внутреннего зева (цветной допплер).",
          "Риск при velamentous / bilobed placenta — проверить.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-57-rfm",
    title: "RCOG · Reduced fetal movements (GTG 57)",
    summary: "Снижение шевелений: обследование и маршрутизация.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obstetrics",
    year: 2011,
    status: "active",
    documentNumber: "GTG No. 57",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "RFM", "CTG", "ultrasound"],
    sections: [
      {
        title: "УЗИ в маршруте",
        bullets: [
          "Биометрия, AFI, допплер по клинической ситуации.",
          "Не заменяет локальный алгоритм «шевеления» ЛПУ / КР РФ.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-51-twins",
    title: "RCOG · Monochorionic twin pregnancy (GTG 51)",
    summary: "Монохориальная двойня: мониторинг, TTTS, рост.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "prenatal",
    year: 2016,
    status: "active",
    documentNumber: "GTG No. 51",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "twins", "TTTS", "monochorionic"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Хориальность в I триместре; регулярный surveillance.",
          "Смотрите также ISUOG twin pregnancy (хаб ISUOG).",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-21-ectopic",
    title: "RCOG · Ectopic pregnancy (GTG 21)",
    summary: "Эктопическая беременность: диагностика и менеджмент.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obgyn",
    year: 2016,
    status: "active",
    documentNumber: "GTG No. 21",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "ectopic", "early pregnancy"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Локализация плодного яйца; PUL; аднексальная масса / free fluid.",
          "В SonoGyn — сценарий «малый срок» FMF / Guided.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-17-recurrent-miscarriage",
    title: "RCOG · Recurrent miscarriage (GTG 17)",
    summary: "Привычное невынашивание: обследование и поддержка.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obgyn",
    year: 2023,
    status: "active",
    documentNumber: "GTG No. 17",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "miscarriage", "early pregnancy"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: ["Критерии неудачи беременности; анатомия матки по показаниям."],
      },
    ],
  },
  {
    id: "rcog-gtg-75-cerclage",
    title: "RCOG · Cervical cerclage (GTG 75)",
    summary: "Серкляж: показания, техника, наблюдение.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obstetrics",
    year: 2022,
    status: "active",
    documentNumber: "GTG No. 75",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "cerclage", "cervix", "PTB"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Трансвагинальная длина шейки (CL); funneling.",
          "В SonoGyn — вкладка «Цервикометрия» в FMF.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-73-pprom",
    title: "RCOG · Suspected PPROM from 24+0 (GTG 73)",
    summary: "Подозрение на преждевременный разрыв плодных оболочек ≥24 нед.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obstetrics",
    year: 2019,
    status: "active",
    documentNumber: "GTG No. 73",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "PPROM", "preterm"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: ["AFI / deepest pocket; предлежание; исключить осложнения."],
      },
    ],
  },
  {
    id: "rcog-gtg-62-ovarian-premeno",
    title: "RCOG · Suspected ovarian masses (premenopausal) (GTG 62)",
    summary: "Подозрительные образования яичников у пременопаузы.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obgyn",
    year: 2011,
    status: "active",
    documentNumber: "GTG No. 62",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "ovary", "mass", "O-RADS"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "Морфология, васкуляризация; в SonoGyn — калькулятор O-RADS US v2022.",
          "RCOG — UK-контекст; стратификация в продукте — по ACR O-RADS.",
        ],
      },
    ],
  },
  {
    id: "rcog-gtg-34-ovarian-postmeno",
    title: "RCOG · Ovarian cysts in postmenopausal women (GTG 34)",
    summary: "Кисты яичников в постменопаузе.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obgyn",
    year: 2016,
    status: "active",
    documentNumber: "GTG No. 34",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "ovary", "postmenopause"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: ["Простые vs сложные; связь с O-RADS / локальным протоколом."],
      },
    ],
  },
  {
    id: "rcog-gtg-67-endometrial-hyperplasia",
    title: "RCOG · Endometrial hyperplasia (GTG 67)",
    summary: "Гиперплазия эндометрия: диагностика и ведение.",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "rcog",
    specialty: "obgyn",
    year: 2016,
    status: "active",
    documentNumber: "GTG No. 67",
    officialUrl: RCOG_BROWSE_URL,
    tags: ["RCOG", "endometrium", "hyperplasia"],
    sections: [
      {
        title: "УЗИ-фокус",
        bullets: [
          "M-эхо, очаговые изменения; см. ISUOG endometrium consensus.",
          "Тактика — по КР РФ + биопсия по показаниям.",
        ],
      },
    ],
  },
];
