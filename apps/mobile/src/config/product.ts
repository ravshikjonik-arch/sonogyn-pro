/**
 * Единый бренд продукта — основа монорепозитория.
 * Технические id (Expo slug, Android package) пока legacy: us-risk-calc / com.yakrav7700.usriskcalc.
 */
export const PRODUCT = {
  brand: "SonoGyn",
  fullName: "SonoGyn Pro",
  shortName: "SonoGyn",
  taglineRu: "Чат врачей · AI-помощник · УЗИ и акушерство-гинекология",
  taglineEn: "Doctors chat · AI assistant · ultrasound and OBGYN",
  descriptionRu:
    "Клиническая платформа для врача УЗИ и акушера-гинеколога: чат врачей, AI-помощник, Помощник врача-гинеколога, Помощник врача-акушера, Помощник врача УЗИ, Evidence-поиск и рабочие инструменты O-RADS, BI-RADS, FMF/RU, FIGO, IOTA. Ассистивный CDS, не замена заключения специалиста.",
  /** Планируемые домены; legacy-префиксы deep link сохранены в AppStack. */
  domains: {
    primary: "sonogyn.com",
    regional: "sonogyn.ru",
  },
  /** Роль в монорепозитории */
  monorepoRole: "foundation" as const,
  packagePath: "apps/mobile",
} as const;
