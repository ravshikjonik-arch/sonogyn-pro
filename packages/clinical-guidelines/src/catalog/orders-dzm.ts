import type { ClinicalGuideline } from "../types";

/**
 * Приказы и протоколы ДЗМ.
 * Добавляйте сюда каждый приказ отдельной записью (номер, дата, ссылка mos.ru / официальный PDF).
 */
export const ORDERS_DZM: ClinicalGuideline[] = [
  {
    id: "dzm-us-screening-placeholder",
    title: "[Шаблон] Приказ ДЗМ — стандарты УЗ-скринингов",
    summary:
      "Заготовка полки. Замените на актуальный приказ: номер, дата, ссылка на официальный текст. Сюда — скрининги, маршруты, требования к описанию.",
    shelf: "orders_dzm",
    documentKind: "order",
    issuer: "dzm",
    specialty: "ultrasound",
    year: 2025,
    status: "draft",
    documentNumber: "№ ___-___",
    effectiveFrom: "ДД.ММ.ГГГГ",
    tags: ["ДЗМ", "скрининг", "УЗИ", "шаблон"],
    sections: [
      {
        title: "Как заполнить эту карточку",
        bullets: [
          "Укажите точное название и номер приказа ДЗМ.",
          "Добавьте officialUrl на mos.ru или PDF.",
          "Краткие выдержки по разделам: показания, сроки, отчётность.",
        ],
      },
    ],
  },
];
