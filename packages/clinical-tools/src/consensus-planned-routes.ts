/**
 * Перспективные классификации — маршрут «учебно», без копирования ACR/ETA/INTERGROWTH.
 */
export type ConsensusPlannedRoute = {
  registryKey: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Куда вести в продукте сегодня */
  primaryHref: string;
  primaryLabel: string;
  officialUrl?: string;
  bullets: string[];
};

export const CONSENSUS_PLANNED_ROUTES: ConsensusPlannedRoute[] = [
  {
    registryKey: "o-rads-mri",
    slug: "o-rads-mri",
    title: "O-RADS MRI",
    subtitle: "ACR — МРТ яичников и придатков. Отдельный engine не внедрён.",
    primaryHref: "/tools/calc/rads/o-rads",
    primaryLabel: "O-RADS US + справка МРТ в калькуляторе",
    officialUrl:
      "https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/O-RADS",
    bullets: [
      "В протоколе МРТ — категория O-RADS MRI по ACR; не смешивать с O-RADS US без явной пометки.",
      "УЗИ остаётся первичным для рутины; МРТ — по показаниям и локальному протоколу.",
      "Таблица ориентиров в UI — справочно, не замена официального алгоритма ACR.",
    ],
  },
  {
    registryKey: "eu-tirads",
    slug: "eu-tirads",
    title: "EU-TIRADS",
    subtitle: "European Thyroid Association — узловой зоб. Рядом с ACR TI-RADS.",
    primaryHref: "/tools/calc/rads/ti-rads",
    primaryLabel: "TI-RADS · профиль ETA / КР 2024",
    officialUrl: "https://eta-website.org",
    bullets: [
      "ACR TI-RADS и EU-TIRADS — разные шкалы; баллы не суммируются.",
      "В калькуляторе щитовидной — переключатель профиля EU (КР 2024 / ETA 2023).",
      "Тактика ТАБ — по локальному КР (МЗ РФ) и заключению специалиста.",
    ],
  },
  {
    registryKey: "intergrowth",
    slug: "intergrowth",
    title: "INTERGROWTH-21st",
    subtitle: "Стандарты роста плода — перцентили и EFW. Hadlock уже в продукте.",
    primaryHref: "/tools/calc/ob/fetal-weight",
    primaryLabel: "Масса плода (Hadlock) · формулы и источники",
    officialUrl: "https://intergrowth21.tghn.org",
    bullets: [
      "Полный набор кривых INTERGROWTH-21st — в дорожной карте; не подменяет таблицы центра.",
      "Сейчас: Hadlock / Robinson / срок — в акушерском хабе и фетометрии.",
      "При FGR — допплер и маршрут ISUOG / FMF, не только перцентиль EFW.",
    ],
  },
];

export function getConsensusPlannedRoute(slug: string): ConsensusPlannedRoute | undefined {
  return CONSENSUS_PLANNED_ROUTES.find((r) => r.slug === slug);
}

export function getConsensusPlannedRouteByKey(key: string): ConsensusPlannedRoute | undefined {
  return CONSENSUS_PLANNED_ROUTES.find((r) => r.registryKey === key);
}