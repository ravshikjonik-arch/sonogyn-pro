/** Быстрые маршруты Command Center и глобального поиска (Ctrl+K). */

export type PlatformQuickLink = {
  href: string;
  title: string;
  subtitle: string;
};

export const PLATFORM_QUICK_LINKS: PlatformQuickLink[] = [
  {
    href: "/home",
    title: "Рабочий стол",
    subtitle: "Command Center · избранные калькуляторы и недавние расчёты",
  },
  {
    href: "/pricing",
    title: "Тарифы Free / PRO",
    subtitle: "Демо-кабинет и подписка PRO для врачей УЗД и АГ",
  },
  {
    href: "/tools/calc/appointment",
    title: "Калькуляторы приёма",
    subtitle: "Bishop, VBAC, EFW и другие расчёты для амбулаторного приёма",
  },
  {
    href: "/tools/calc/rads/o-rads",
    title: "O-RADS US",
    subtitle: "Wizard, IOTA и таблицы ACR для аднексальных образований",
  },
  {
    href: "/tools/calc/ob/bishop",
    title: "Шкала Bishop",
    subtitle: "Зрелость шейки матки перед индукцией родов",
  },
  {
    href: "/tools/calc/ob/vbac",
    title: "VBAC / TOLAC",
    subtitle: "Отбор и мониторинг родов после кесарева сечения",
  },
  {
    href: "/tools/calc/ob/fetal-weight",
    title: "Масса плода (EFW)",
    subtitle: "Hadlock, Рудаков и антропометрия матери",
  },
  {
    href: "/ai/consultants/fmf",
    title: "FMF · пренатальный скрининг",
    subtitle: "I триместр, КТР, ТВП, допплер и шейка матки",
  },
  {
    href: "/tools/obstetrics",
    title: "Хаб акушерства",
    subtitle: "FMF, фетометрия, Bishop, VBAC и атласы",
  },
  {
    href: "/tools/gynecology",
    title: "Хаб гинекологии",
    subtitle: "O-RADS, FIGO, эндометрий, шейка матки, эластография",
  },
];
