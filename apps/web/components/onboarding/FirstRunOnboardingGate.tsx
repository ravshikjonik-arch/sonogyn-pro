"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bot, Calculator, FileText } from "lucide-react";

import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  firstRunProgressPercent,
  readFirstRunState,
  skipFirstRunOnboarding,
  syncFirstRunStepsFromPath,
  type FirstRunState,
} from "@/lib/onboarding/first-run-storage";
import { CDS_DISCLAIMER_RU } from "@/lib/config/platform";

const STEPS = [
  {
    id: "calculator" as const,
    title: "Первый расчёт в калькуляторе",
    description: "Откройте любой клинический калькулятор и выполните пробный расчёт.",
    href: "/tools/calc/rads/o-rads",
    cta: "O-RADS",
    icon: Calculator,
  },
  {
    id: "aiAssistant" as const,
    title: "Вопрос AI-помощнику",
    description: "Задайте уточняющий вопрос по тактике или классификации (CDS, не диагноз).",
    href: "/ai/consultants/gynecology",
    cta: "Помощник",
    icon: Bot,
  },
  {
    id: "protocolDraft" as const,
    title: "Черновик протокола",
    description: "Откройте шаблон структурированного заключения и сохраните черновик.",
    href: "/reports/adnex",
    cta: "Протокол придатков",
    icon: FileText,
  },
];

export function FirstRunOnboardingGate() {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FirstRunState>(() => readFirstRunState());

  const refresh = useCallback(() => {
    setState(readFirstRunState());
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const synced = syncFirstRunStepsFromPath(pathname);
    if (synced) setState(synced);
  }, [pathname]);

  useEffect(() => {
    if (!ready || !user) {
      setOpen(false);
      return;
    }
    const s = readFirstRunState();
    setState(s);
    setOpen(s.status === "active");
  }, [ready, user]);

  useEffect(() => {
    if (state.status === "completed") setOpen(false);
  }, [state.status]);

  function onSkip() {
    skipFirstRunOnboarding();
    refresh();
    setOpen(false);
  }

  const progress = firstRunProgressPercent(state.steps);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-[var(--clinical-border)] bg-[var(--clinical-card)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">Первые шаги в кабинете</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Три коротких действия, чтобы освоить рабочий контур. Можно пропустить — вернуться к задачам позже.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--clinical-foreground-muted)]">
            <span>Прогресс</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} aria-label="Прогресс онбординга" />
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, index) => {
            const done = state.steps[step.id];
            const Icon = step.icon;
            return (
              <li
                key={step.id}
                className={`rounded-xl border p-3 ${
                  done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30"
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      done
                        ? "bg-emerald-600 text-white"
                        : "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-bold text-[var(--clinical-foreground)]">
                      <Icon className="h-4 w-4 text-[var(--clinical-primary)]" aria-hidden />
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {step.description}
                    </p>
                    {!done ? (
                      <Button variant="link" size="sm" className="mt-1 h-auto px-0" asChild>
                        <Link href={step.href}>
                          {step.cta}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{CDS_DISCLAIMER_RU}</p>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Пропустить
          </Button>
          {progress === 100 ? (
            <Button type="button" onClick={() => setOpen(false)}>
              Готово
            </Button>
          ) : (
            <Button type="button" variant="secondary" asChild>
              <Link href="/home">К рабочему столу</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
