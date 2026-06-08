/**
 * Единый бренд продукта — основа монорепозитория.
 * Технические id (Expo slug, Android package) пока legacy: us-risk-calc / com.yakrav7700.usriskcalc.
 */
export const PRODUCT = {
  brand: "SonoGyn",
  fullName: "SonoGyn Pro",
  shortName: "SonoGyn",
  taglineRu: "УЗИ и гинекология · клинические калькуляторы",
  taglineEn: "Ultrasound & gynecology · clinical decision support",
  descriptionRu:
    "Клинические калькуляторы и рабочее место врача УЗИ и акушера-гинеколога: O-RADS, BI-RADS, FIGO, IOTA, кейсы. Учебный CDS, не замена заключения специалиста.",
  /** Планируемые домены; legacy-префиксы deep link сохранены в AppStack. */
  domains: {
    primary: "sonogyn.com",
    regional: "sonogyn.ru",
  },
  /** Роль в монорепозитории */
  monorepoRole: "foundation" as const,
  packagePath: "apps/mobile",
} as const;
