"use client";

import { Check, Lock, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { onUpgradeOpen } from "@/lib/pro/upgrade-bus";

const BENEFITS = [
  "Безлимитные AI-запросы",
  "Автоматические заключения по гайдлайнам",
  "AI-анализ исследований и снимков",
  "Расширенная аналитика и динамика",
  "Голосовой помощник",
  "Приоритетная обработка",
];

const LOCKED = [
  "AI Полное заключение",
  "AI Диагностические рекомендации",
  "Расширенная аналитика",
  "Безлимитные AI-запросы",
];

/** Глобальная модалка апгрейда (Notion AI-стиль). Открывается через openUpgrade(). */
export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();

  useEffect(() => {
    return onUpgradeOpen((detail) => {
      setFeature(detail.feature);
      setOpen(true);
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="ai-gradient-bg relative px-6 py-7 text-white">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />
          <span className="ai-breathe flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <DialogHeader className="mt-4 space-y-1 text-left">
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              Раскройте весь потенциал Sonogyn AI
            </DialogTitle>
            <DialogDescription className="text-white/85">
              {feature
                ? `«${feature}» доступно на PRO. Перейдите на следующий уровень платформы.`
                : "Перейдите на следующий уровень возможностей платформы."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-[var(--clinical-foreground)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ai-success)]" />
                {b}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--clinical-foreground-muted)]">
              <Lock className="h-3.5 w-3.5" />
              На бесплатном тарифе закрыто
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LOCKED.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-1 text-[11px] text-[var(--clinical-foreground-muted)]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="ai-gradient-bg flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold text-white shadow-lg transition hover:opacity-95"
          >
            <Rocket className="h-5 w-5" />
            Перейти на PRO
          </Link>
          <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
            Отмена в любой момент. Оплата — ЮKassa / карта.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
