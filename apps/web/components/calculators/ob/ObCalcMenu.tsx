import Link from "next/link";
import {
  Baby,
  CalendarDays,
  ChevronRight,
  Cross,
  Droplets,
  Egg,
  Flower2,
  Ruler,
  ScanLine,
  Stethoscope,
  Syringe,
  type LucideIcon,
  UserRound,
  Waves,
} from "lucide-react";

type Row = {
  href: string;
  title: string;
  icon: LucideIcon;
  tone: string;
};

type Section = {
  title: string;
  hint?: string;
  rows: Row[];
};

const SECTIONS: Section[] = [
  {
    title: "Срок беременности",
    hint: "Календарные методы",
    rows: [
      { href: "/tools/calc/ob?tab=lmp", title: "Срок беременности по менструации", icon: Droplets, tone: "bg-sky-500" },
      { href: "/tools/calc/ob?tab=us", title: "Срок беременности по УЗИ", icon: ScanLine, tone: "bg-cyan-500" },
      { href: "/tools/calc/ob?tab=ivf", title: "Срок беременности по овуляции (ЭКО)", icon: Egg, tone: "bg-teal-500" },
      { href: "/tools/calc/ob?tab=movement", title: "Срок беременности по шевелениям плода", icon: Baby, tone: "bg-sky-600" },
      {
        href: "/tools/calc/ob?tab=antenatal",
        title: "Срок беременности по явке в женскую консультацию",
        icon: Stethoscope,
        tone: "bg-cyan-600",
      },
      { href: "/tools/calc/ob?tab=dekret", title: "Сроки декретного отпуска", icon: CalendarDays, tone: "bg-blue-500" },
      { href: "/tools/calc/ob?tab=edd", title: "Срок беременности по предполагаемой дате родов", icon: CalendarDays, tone: "bg-sky-500" },
    ],
  },
  {
    title: "Срок беременности",
    hint: "Инструментальные методы",
    rows: [
      { href: "/tools/calc/ob?tab=crl", title: "Срок беременности по КТР (I триместр)", icon: Ruler, tone: "bg-sky-500" },
      { href: "/tools/calc/ob?tab=feto", title: "Срок беременности по фетометрии (II триместр)", icon: Ruler, tone: "bg-cyan-500" },
    ],
  },
  {
    title: "Масса плода",
    rows: [
      {
        href: "/tools/calc/ob/fetal-weight?tab=maternal",
        title: "Предполагаемая масса плода по антропометрии матери",
        icon: UserRound,
        tone: "bg-blue-500",
      },
      { href: "/tools/calc/ob/fetal-weight?tab=rudakov", title: "Метод Рудакова", icon: Waves, tone: "bg-blue-600" },
    ],
  },
  {
    title: "Акушерские калькуляторы",
    rows: [
      { href: "/tools/calc/ob/bishop", title: "Шкала Бишопа", icon: Cross, tone: "bg-orange-500" },
      { href: "/tools/calc/ob/vbac?tab=pre", title: "Вагинальные роды после кесарева сечения (до родов)", icon: Baby, tone: "bg-violet-500" },
      { href: "/tools/calc/ob/vbac?tab=labor", title: "Вагинальные роды после кесарева сечения (в родах)", icon: Baby, tone: "bg-violet-600" },
    ],
  },
  {
    title: "Гинекологические калькуляторы",
    rows: [
      { href: "/tools/calc/gyn/breast-risk", title: "Риск рака молочной железы", icon: Flower2, tone: "bg-pink-500" },
      { href: "/tools/calc/gyn/cervical-cancer-risk", title: "Риск рака шейки матки", icon: Syringe, tone: "bg-sky-500" },
      {
        href: "/tools/calc/gyn/cin-follow-up",
        title: "Наблюдение после кольпоскопии или лечения CIN",
        icon: ScanLine,
        tone: "bg-cyan-500",
      },
      { href: "/tools/calc/gyn/ovarian-cancer-risk", title: "Риск рака яичников", icon: Flower2, tone: "bg-rose-500" },
    ],
  },
];

export function ObCalcMenu() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Акушерский калькулятор</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Срок, масса, Бишоп, роды после кесарева и гинекологические риски. Лекарства — в «Аптеке врача».
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={`${section.title}-${section.hint ?? "list"}`} className="space-y-2">
          <div className="px-1">
            <h2 className="text-sm font-semibold text-[var(--clinical-foreground)]">{section.title}</h2>
            {section.hint ? (
              <p className="text-xs text-[var(--clinical-foreground-muted)]">{section.hint}</p>
            ) : null}
          </div>
          <ul className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            {section.rows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.href} className="border-b border-[var(--clinical-border)] last:border-b-0">
                  <Link href={row.href} className="flex items-center gap-3 px-3 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${row.tone}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{row.title}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="px-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Расчёты носят ориентировочный характер и не заменяют заключение врача.
      </p>
    </div>
  );
}
