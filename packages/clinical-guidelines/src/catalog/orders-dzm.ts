import type { ClinicalGuideline } from "../types";

/**
 * Приказы и протоколы ДЗМ.
 * Только официальные ссылки (mos.ru / mosgorzdrav). Выдержки — краткие, не подмена текста приказа.
 */
export const ORDERS_DZM: ClinicalGuideline[] = [
  {
    id: "dzm-prenatal-screening-route",
    title: "Маршрут пренатального скрининга (ДЗМ)",
    summary:
      "Организация скрининга I–II триместра, сроки УЗИ 11–14 и 19–21 нед., взаимодействие с женскими консультациями Москвы.",
    shelf: "orders_dzm",
    documentKind: "order",
    issuer: "dzm",
    specialty: "prenatal",
    year: 2024,
    status: "active",
    documentNumber: "уточните на портале ДЗМ",
    officialUrl: "https://mosgorzdrav.ru/documents",
    tags: ["ДЗМ", "скрининг", "11-13", "18-21", "маршрут"],
    sections: [
      {
        title: "Для врача УЗД",
        bullets: [
          "Сверяйте окна скрининга с калькулятором сроков и локальным приказом ЛПУ.",
          "Официальный текст — только на mosgorzdrav.ru / в ЛПУ.",
        ],
      },
    ],
  },
  {
    id: "dzm-obstetric-ultrasound-standards",
    title: "Стандарты УЗ-исследований в акушерстве (ДЗМ)",
    summary:
      "Требования к объёму протокола, срокам плановых УЗИ, документированию скринингов.",
    shelf: "orders_dzm",
    documentKind: "protocol",
    issuer: "dzm",
    specialty: "ultrasound",
    year: 2023,
    status: "active",
    officialUrl: "https://mosgorzdrav.ru/documents",
    tags: ["ДЗМ", "УЗИ", "акушерство", "протокол"],
    sections: [
      {
        title: "Применение в SonoGyn Pro",
        bullets: [
          "Чеклисты FMF и нормы — в разделе «Обучение»; обязательный минимум — из приказа ДЗМ.",
        ],
      },
    ],
  },
  {
    id: "dzm-gynecology-day-hospital",
    title: "Дневной стационар · гинекология (ДЗМ)",
    summary:
      "Показания и маршрут пациенток при плановых и срочных гинекологических вмешательствах (региональные стандарты Москвы).",
    shelf: "orders_dzm",
    documentKind: "order",
    issuer: "dzm",
    specialty: "obgyn",
    year: 2022,
    status: "active",
    officialUrl: "https://mosgorzdrav.ru/documents",
    tags: ["ДЗМ", "гинекология", "маршрут"],
  },
  {
    id: "dzm-oncology-screening-cervix",
    title: "Организация скрининга РШМ (ДЗМ)",
    summary:
      "Цитология / ВПЧ, интервалы наблюдения, направление к кольпоскопии — в связке с КР МЗ РФ.",
    shelf: "orders_dzm",
    documentKind: "order",
    issuer: "dzm",
    specialty: "obgyn",
    year: 2023,
    status: "active",
    officialUrl: "https://mosgorzdrav.ru/documents",
    tags: ["ДЗМ", "РШМ", "ВПЧ", "скрининг"],
  },
  {
    id: "dzm-us-screening-placeholder",
    title: "[Архив] Шаблон карточки ДЗМ",
    summary: "Служебная запись. Заменена карточками выше; не отображается в активном поиске.",
    shelf: "orders_dzm",
    documentKind: "order",
    issuer: "dzm",
    specialty: "ultrasound",
    year: 2025,
    status: "draft",
    documentNumber: "№ ___-___",
    tags: ["шаблон"],
    sections: [
      {
        title: "Как добавить приказ",
        bullets: [
          "Скопируйте структуру активной карточки.",
          "Укажите officialUrl на PDF или страницу mosgorzdrav.ru.",
        ],
      },
    ],
  },
];