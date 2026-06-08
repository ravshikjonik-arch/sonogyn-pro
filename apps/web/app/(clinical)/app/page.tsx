import {
  MessageCircle,
  Brain,
  Calculator,
  FileText,
  GraduationCap,
  HandHeart,
  CircleDot,
  Layers,
  ScanLine,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { loadDoctorCabinetLabelForSession } from "@/lib/auth/load-doctor-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tiles = [
  {
    title: "Чат врачей",
    description: "Общий чат + гинекология + акушерство. Фото/видео в сообщениях и кейсы.",
    href: "/cases",
    icon: MessageCircle,
    badge: "Live",
    accentBar: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  {
    title: "Помощник врача",
    description: "Нозология → анализы → УЗИ → лечение → протокол. Поиск и голос.",
    href: "/assistant",
    icon: HandHeart,
    badge: "Маршрут",
    accentBar: "bg-gradient-to-r from-rose-600 to-pink-500",
  },
  {
    title: "Калькуляторы",
    description: "O-RADS, BI-RADS, TI-RADS, FIGO, FMF, эластография — по гайдлайнам и КР.",
    href: "/calculators",
    icon: Calculator,
    badge: "CDS",
    accentBar: "bg-gradient-to-r from-blue-500 to-cyan-400",
  },
  {
    title: "КР и приказы",
    description: "КР МЗ РФ, приказы ДЗМ — отдельные полки с быстрым поиском.",
    href: "/guidelines",
    icon: FileText,
    badge: "КР",
    accentBar: "bg-gradient-to-r from-amber-500 to-orange-400",
  },
  {
    title: "Библиотека",
    description: "Протоколы, чеклисты, атласы — образовательный слой.",
    href: "/library",
    icon: Layers,
    badge: "Edu",
    accentBar: "bg-gradient-to-r from-violet-500 to-purple-400",
  },
  {
    title: "ISUOG — базовый курс",
    description: "Basic Training: лекция 6 — ранняя беременность 4–10 нед, презентация на Яндекс.Диске.",
    href: "/library/basic-course",
    icon: GraduationCap,
    badge: "ISUOG",
    accentBar: "bg-gradient-to-r from-rose-600 to-orange-500",
  },
  {
    title: "Макеты УЗИ",
    description: "Матка, яичник, МЖ — выбор макета и порядка в меню.",
    href: "/mockups",
    icon: Layers,
    badge: "3 макета",
    accentBar: "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500",
  },
  {
    title: "Макет яичника · O-RADS",
    description: "Увеличенный яичник: фолликулы, кисты, ИИ по фото/видео, текст в протокол.",
    href: "/ovary-atlas",
    icon: CircleDot,
    badge: "ИИ",
    accentBar: "bg-gradient-to-r from-violet-600 to-purple-500",
  },
  {
    title: "Макет матки · FIGO",
    description: "Коронарный разрез или сагиттальный срез — локализация и FIGO в протокол.",
    href: "/uterus-3d",
    icon: Stethoscope,
    badge: "FIGO",
    accentBar: "bg-gradient-to-r from-indigo-500 to-blue-400",
  },
  {
    title: "Макет молочной железы",
    description: "Схема обеих МЖ: часы, см от соска, квадрант — текст в протокол.",
    href: "/breast-3d",
    icon: ScanLine,
    badge: "BI-RADS",
    accentBar: "bg-gradient-to-r from-pink-500 to-rose-400",
  },
  {
    title: "AI-рабочая зона",
    description: "Загрузка снимков, orchestrator, CDS-preview — ассистивно.",
    href: "/workspace",
    icon: Brain,
    badge: "AI",
    accentBar: "bg-gradient-to-r from-sky-500 to-blue-500",
  },
];

export default async function CommandCenterPage() {
  const cabinet = await loadDoctorCabinetLabelForSession();

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="sonogyn-glass-card sonogyn-hero-orbs sonogyn-enter relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--clinical-primary)]/10 via-transparent to-violet-500/10" />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-[var(--clinical-primary)]/30 bg-white/60">
                {cabinet.doctorLine ? `${cabinet.cabinetTitle} · ${cabinet.doctorLine}` : cabinet.cabinetTitle}
              </Badge>
              <Badge className="gap-1 bg-[var(--clinical-primary)]">
                <Sparkles className="h-3 w-3" />
                PRO-ready
              </Badge>
            </div>
            <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
              {cabinet.doctorLine
                ? `${cabinet.cabinetTitle} — ${cabinet.doctorLine}`
                : cabinet.cabinetTitle}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-[var(--clinical-foreground-muted)]">
              {cabinet.doctorLine
                ? "Персональный рабочий стол: калькуляторы, 3D, КР МЗ РФ и кейсы — один клик до инструмента."
                : "Калькуляторы, 3D, КР МЗ РФ и кейсы — без «каши» в меню. Укажите ФИО в профиле или при регистрации."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="sonogyn-cta-glow">
                <Link href="/calculators">Открыть калькуляторы</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/cases">Новый кейс</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="sonogyn-glass-card sonogyn-enter sonogyn-enter-delay-1 flex flex-wrap items-center gap-3 rounded-2xl p-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
            <Zap className="h-4 w-4 text-[var(--clinical-primary)]" />
            Быстрый старт смены
          </div>
          {[
            { href: "/assistant/gynecology", label: "Помощник АГ" },
            { href: "/assistant/fmf", label: "FMF · I скрининг" },
            { href: "/calculators/o-rads", label: "O-RADS Pro" },
            { href: "/calculators/bi-rads", label: "BI-RADS US" },
            { href: "/calculators/endometrium", label: "Эндометрий" },
            { href: "/calculators/cervical-length", label: "CL шейки" },
            { href: "/calculators/figo", label: "FIGO" },
            { href: "/calculators/elastography", label: "Эластография" },
            { href: "/mockups", label: "Макеты" },
            { href: "/uterus-3d", label: "Макет матки" },
            { href: "/ovary-atlas", label: "Макет яичника" },
            { href: "/breast-3d", label: "Макет МЖ" },
            { href: "/guidelines", label: "КР МЗ РФ" },
            { href: "/library/basic-course", label: "ISUOG курс" },
            { href: "/cases/new", label: "Новый кейс" },
          ].map((link) => (
            <Button key={link.href} variant="outline" size="sm" className="rounded-full" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <span className="ml-auto hidden items-center gap-2 text-xs text-[var(--clinical-foreground-muted)] sm:flex">
            <span className="sonogyn-live-dot" aria-hidden />
            Модули online · dev
          </span>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile, index) => {
            const Icon = tile.icon;
            const delayClass =
              index === 0
                ? "sonogyn-enter-delay-1"
                : index === 1
                  ? "sonogyn-enter-delay-2"
                  : index === 2
                    ? "sonogyn-enter-delay-3"
                    : "sonogyn-enter-delay-3";
            return (
              <Card
                key={tile.href}
                className={`sonogyn-tile-hover sonogyn-enter ${delayClass} group flex flex-col overflow-hidden border-slate-200/90 bg-white dark:bg-[var(--clinical-card)]`}
              >
                <div className={`h-1 ${tile.accentBar}`} />
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--clinical-primary-muted)] to-white text-[var(--clinical-primary-deep)] shadow-sm transition group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="default">{tile.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg">{tile.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{tile.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-2">
                  <Button variant="secondary" className="w-full group-hover:bg-[var(--clinical-primary-muted)]" asChild>
                    <Link href={tile.href}>Открыть модуль →</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
