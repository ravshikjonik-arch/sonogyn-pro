import {
  Baby,
  BookOpen,
  Brain,
  ChevronRight,
  Flower2,
  MessageCircle,
  Pill,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { RecentCalculationsPanel } from "@/components/clinical/RecentCalculationsPanel";

type Row = {
  title: string;
  detail: string;
  href: string;
};

type Group = {
  title: string;
  icon: LucideIcon;
  rows: Row[];
};

const groups: Group[] = [
  {
    title: "Сразу к работе",
    icon: MessageCircle,
    rows: [
      { title: "Чат врачей", detail: "Общий канал и специальности", href: "/cases" },
      { title: "AI-помощник", detail: "Разбор без персональных данных", href: "/ai/consultants" },
      { title: "Кейсы и обучение", detail: "Учебные случаи и задачи", href: "/tools/refs/quiz-hub" },
    ],
  },
  {
    title: "Акушерство",
    icon: Baby,
    rows: [
      { title: "Акушерский калькулятор", detail: "Срок, фетометрия, риски", href: "/tools/calc/ob" },
      { title: "FMF и скрининг", detail: "I триместр, КТР, ТВП", href: "/ai/consultants/fmf" },
      { title: "Нормы фетометрии", detail: "Таблицы по сроку", href: "/tools/calc/ob/fetometry-norms" },
      { title: "Шейка матки", detail: "Длина шейки", href: "/tools/calc/ob/cervical-length" },
      { title: "Протоколы и атлас", detail: "Срезы, допплер, отчёт", href: "/tools/obstetrics" },
    ],
  },
  {
    title: "Гинекология",
    icon: Flower2,
    rows: [
      { title: "O-RADS", detail: "Образования придатков", href: "/tools/calc/rads/o-rads" },
      { title: "IOTA", detail: "Простые правила и ADNEX", href: "/tools/calc/rads/iota" },
      { title: "Калькуляторы", detail: "Эндометрий, POP-Q, шейка", href: "/tools/calc/gyn" },
      { title: "Нозологии", detail: "Миома, эндометрий, яичник", href: "/tools/refs/nosologies" },
      { title: "FIGO · миома", detail: "Тип узла на схеме матки", href: "/tools/mapping/uterus" },
    ],
  },
  {
    title: "Маммология",
    icon: ScanLine,
    rows: [
      { title: "BI-RADS", detail: "Категория и протокол", href: "/tools/calc/rads/bi-rads" },
      { title: "Оценка риска", detail: "Ориентир, не диагноз", href: "/tools/calc/gyn/breast-risk" },
      { title: "Атлас", detail: "Учебные изображения", href: "/tools/refs/mammology-national-atlas" },
    ],
  },
  {
    title: "УЗ-диагностика",
    icon: Brain,
    rows: [
      { title: "TI-RADS", detail: "Щитовидная железа", href: "/tools/calc/rads/ti-rads" },
      { title: "LN-RADS", detail: "Лимфоузлы", href: "/tools/calc/rads/ln-rads" },
      { title: "Все калькуляторы", detail: "Акушерство, гинекология, RADS", href: "/tools/calc" },
      { title: "Справочник", detail: "КР, нормы, атласы", href: "/tools/refs" },
    ],
  },
  {
    title: "Аптека",
    icon: Pill,
    rows: [{ title: "Аптека врача", detail: "Препараты для практики", href: "/tools/pharmacy" }],
  },
];

function GroupList({ group }: { group: Group }) {
  const Icon = group.icon;
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">
        <Icon className="h-4 w-4" aria-hidden />
        {group.title}
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
        {group.rows.map((row, index) => (
          <li key={row.href} className={index > 0 ? "border-t border-[var(--clinical-border)]" : undefined}>
            <Link
              href={row.href}
              className="flex items-center gap-3 px-4 py-3 active:bg-[var(--clinical-muted)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[var(--clinical-foreground)]">{row.title}</span>
                <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">{row.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NosologyHome() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg space-y-6 px-4 py-6 pb-28 sm:max-w-xl">
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sonogyn-avatar.png" alt="" className="h-14 w-14 rounded-2xl object-cover" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">SonoGyn Pro</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Разделы по нозологиям. Решение остаётся за врачом.</p>
        </div>
      </header>
      {groups.map((group) => (
        <GroupList key={group.title} group={group} />
      ))}
      <RecentCalculationsPanel />
      <p className="flex items-center gap-2 px-1 text-xs text-[var(--clinical-foreground-muted)]">
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Справочная поддержка. Не ставит диагноз.
      </p>
    </div>
  );
}
