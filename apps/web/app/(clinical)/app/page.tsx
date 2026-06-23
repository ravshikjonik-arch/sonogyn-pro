import { Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { loadDoctorCabinetLabelForSession } from "@/lib/auth/load-doctor-profile";
import { AICommandCenter } from "@/components/clinical/AICommandCenter";
import { AppHomeActions } from "@/components/clinical/AppHomeActions";
import { AiUsageMeter } from "@/components/pro/AiUsageMeter";
import { PremiumFeaturesTeaser } from "@/components/pro/PremiumFeaturesTeaser";
import { CareerPathWidget } from "@/components/career/CareerPathWidget";
import { ObCalcQuickWidget } from "@/components/calculators/ob/ObCalcQuickWidget";
import { loadCareerProgressForSession } from "@/lib/career/load-career-progress";
import { getHomeTilePresentation } from "@/lib/modules/home-tile-presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModules } from "@repo/clinical-tools";

export default async function CommandCenterPage() {
  const [cabinet, career] = await Promise.all([loadDoctorCabinetLabelForSession(), loadCareerProgressForSession()]);
  const homeTiles = getModules({ surface: "home-tile" });

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
            <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl" data-testid="app-home">
              {cabinet.doctorLine
                ? `${cabinet.cabinetTitle} — ${cabinet.doctorLine}`
                : cabinet.cabinetTitle}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-[var(--clinical-foreground-muted)]">
              {cabinet.doctorLine
                ? "Персональный рабочий стол: калькуляторы, 3D, КР МЗ РФ и кейсы — один клик до инструмента."
                : "Калькуляторы, 3D, КР МЗ РФ и кейсы — без «каши» в меню. Укажите ФИО в профиле или при регистрации."}
            </p>
            <AppHomeActions />
          </div>
        </header>

        <AICommandCenter doctorName={cabinet.doctorLine ? cabinet.cabinetTitle : null} />

        <AiUsageMeter />

        {career.progress.currentStage !== "pro" ? (
          <CareerPathWidget progress={career.progress} variant="compact" />
        ) : null}

        <PremiumFeaturesTeaser />

        <section className="sonogyn-glass-card sonogyn-enter sonogyn-enter-delay-1 flex flex-wrap items-center gap-3 rounded-2xl p-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
            <Zap className="h-4 w-4 text-[var(--clinical-primary)]" />
            Быстрый старт
          </div>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Нажмите «Поиск» (⌘K) — срок, ПДР, O-RADS, чат…
          </p>
          <span className="ml-auto hidden items-center gap-2 text-xs text-[var(--clinical-foreground-muted)] sm:flex">
            <span className="sonogyn-live-dot" aria-hidden />
            Модули online · dev
          </span>
        </section>

        <ObCalcQuickWidget compact />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {homeTiles.map((tile, index) => {
            const presentation = getHomeTilePresentation(tile.id);
            if (!presentation || !tile.href) return null;
            const Icon = presentation.icon;
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
                key={tile.id}
                className={`sonogyn-tile-hover sonogyn-enter ${delayClass} group flex flex-col overflow-hidden border-slate-200/90 bg-white dark:bg-[var(--clinical-card)]`}
              >
                <div className={`h-1 ${presentation.accentBar}`} />
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--clinical-primary-muted)] to-white text-[var(--clinical-primary-deep)] shadow-sm transition group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="default">{presentation.badge}</Badge>
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
