import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  Calculator,
  FileText,
  HeartPulse,
  MessageCircle,
  ScanLine,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const primaryTasks = [
  {
    title: "Разобрать УЗИ-кейс",
    description: "Создать кейс, обсудить с коллегами или открыть обучающие случаи.",
    href: "/cases",
    icon: MessageCircle,
    accent: "border-cyan-300/70",
  },
  {
    title: "Открыть помощника врача",
    description: "Гинекология, акушерство, FMF и сосудистое УЗД в одном хабе.",
    href: "/ai/consultants",
    icon: Stethoscope,
    accent: "border-emerald-300/70",
  },
  {
    title: "Найти КР или алгоритм",
    description: "Короткие карточки, нозологии, нормы, источники и Evidence AI.",
    href: "/tools/refs",
    icon: BookOpenCheck,
    accent: "border-amber-300/70",
  },
  {
    title: "Посчитать и вставить в протокол",
    description: "O-RADS, BI-RADS, TI-RADS, акушерские и гинекологические расчёты.",
    href: "/tools/calc",
    icon: Calculator,
    accent: "border-violet-300/70",
  },
] as const;

const roleRoutes = [
  {
    title: "Я врач УЗИ",
    href: "/tools/calc/rads/o-rads",
    icon: ScanLine,
    steps: ["O-RADS / BI-RADS / TI-RADS", "Атласы и эхограммы", "Структурированный протокол"],
    quickLinks: [
      { label: "O-RADS US", href: "/tools/calc/rads/o-rads" },
      { label: "IOTA ADNEX", href: "/tools/calc/rads/iota" },
      { label: "BI-RADS", href: "/tools/calc/rads/bi-rads" },
      { label: "TI-RADS", href: "/tools/calc/rads/ti-rads" },
    ],
  },
  {
    title: "Я акушер",
    href: "/tools/obstetrics",
    icon: Baby,
    steps: ["FMF и скрининги", "Фетометрия и допплер", "КР и маршрутизация"],
    quickLinks: [
      { label: "FMF", href: "/ai/consultants/fmf" },
      { label: "Bishop", href: "/tools/calc/ob/bishop" },
      { label: "VBAC", href: "/tools/calc/ob/vbac" },
      { label: "EFW", href: "/tools/calc/ob/fetal-weight" },
    ],
  },
  {
    title: "Я гинеколог",
    href: "/tools/gynecology",
    icon: HeartPulse,
    steps: ["FIGO / миомы", "O-RADS и эндометрий", "Эластография и шейка"],
    quickLinks: [
      { label: "FIGO · матка", href: "/tools/mapping/uterus" },
      { label: "Миома", href: "/tools/refs/nosologies/uterine-myoma" },
      { label: "Эластография", href: "/tools/calc/gyn/elastography" },
      { label: "O-RADS", href: "/tools/calc/rads/o-rads" },
    ],
  },
] as const;

const quickSearchHints = [
  { label: "O-RADS", href: "/tools/calc/rads/o-rads" },
  { label: "Миома", href: "/tools/refs/nosologies/uterine-myoma" },
  { label: "Короткая шейка", href: "/tools/calc/ob/cervical-length" },
  { label: "Evidence AI", href: "/tools/refs/evidence-assistant" },
] as const;

export function DoctorStartPanel() {
  return (
    <section className="space-y-5">
      <Card className="border-[var(--clinical-primary)]/25 bg-[var(--clinical-card)] shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Старт врача</Badge>
            <Badge variant="secondary">кейс · КР · калькулятор · протокол</Badge>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
            Что нужно сделать сейчас?
          </CardTitle>
          <CardDescription className="max-w-3xl leading-relaxed">
            Выберите клиническую задачу. SonoGyn ведёт от вопроса врача к нужному модулю: помощнику, КР,
            калькулятору, кейсам или шаблону заключения.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {primaryTasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link key={task.href} href={task.href} className="block">
                  <div
                    className={`h-full rounded-xl border ${task.accent} bg-[var(--clinical-muted)]/40 p-4 transition hover:-translate-y-0.5 hover:bg-[var(--clinical-muted)]`}
                  >
                    <Icon className="h-5 w-5 text-[var(--clinical-primary-deep)]" />
                    <p className="mt-3 text-sm font-bold text-[var(--clinical-foreground)]">{task.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {task.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--clinical-border)] pt-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--clinical-foreground-muted)]">
              <Search className="h-3.5 w-3.5" />
              Быстрый вход:
            </span>
            {quickSearchHints.map((hint) => (
              <Button key={hint.href} variant="outline" size="sm" asChild>
                <Link href={hint.href}>{hint.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {roleRoutes.map((route) => {
          const Icon = route.icon;
          return (
            <Card key={route.href} className="border-[var(--clinical-border)] shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-[var(--clinical-primary)]" />
                  {route.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
                  {route.steps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clinical-primary)]" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1.5">
                  {route.quickLinks.map((link) => (
                    <Button key={link.href} variant="outline" size="sm" className="h-8 text-xs" asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href={route.href}>
                    Открыть маршрут
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-[var(--clinical-primary)]" />
              Рабочий принцип
            </p>
            <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
              Сначала клиническая задача, потом инструмент. Не ищем разделы, а идём по маршруту врача.
            </p>
          </div>
          <Button asChild>
            <Link href="/reports">
              Шаблоны протоколов
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
