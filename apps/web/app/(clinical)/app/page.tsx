import { Sparkles, Zap } from "lucide-react";

import { loadDoctorCabinetLabelForSession } from "@/lib/auth/load-doctor-profile";
import { AICommandCenter } from "@/components/clinical/AICommandCenter";
import { AppHomeActions } from "@/components/clinical/AppHomeActions";
import { DoctorCabinetNavigation } from "@/components/clinical/DoctorCabinetNavigation";
import { AiUsageMeter } from "@/components/pro/AiUsageMeter";
import { PremiumFeaturesTeaser } from "@/components/pro/PremiumFeaturesTeaser";
import { CareerPathWidget } from "@/components/career/CareerPathWidget";
import { ObCalcQuickWidget } from "@/components/calculators/ob/ObCalcQuickWidget";
import { loadCareerProgressForSession } from "@/lib/career/load-career-progress";
import { Badge } from "@/components/ui/badge";

export default async function CommandCenterPage() {
  const [cabinet, career] = await Promise.all([loadDoctorCabinetLabelForSession(), loadCareerProgressForSession()]);

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

        <DoctorCabinetNavigation />
      </div>
    </div>
  );
}
