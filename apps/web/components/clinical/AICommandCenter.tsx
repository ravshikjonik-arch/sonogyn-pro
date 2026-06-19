"use client";

import {
  ArrowUpRight,
  Brain,
  FileText,
  ScanLine,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FadeIn } from "@/components/ui/motion";
import { openCopilot } from "@/lib/ai/copilot-bus";
import { cn } from "@/lib/utils/cn";

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Если задан href — навигация; иначе открываем копайлот с seed-запросом. */
  href?: string;
  seed?: string;
  accent: string;
};

const ACTIONS: QuickAction[] = [
  {
    id: "report",
    label: "Создать заключение",
    icon: FileText,
    seed: "Помоги составить медицинское заключение по УЗИ.",
    accent: "var(--ai-blue)",
  },
  {
    id: "analyze",
    label: "Проанализировать УЗИ",
    icon: ScanLine,
    href: "/workspace",
    accent: "var(--ai-indigo)",
  },
  {
    id: "patient",
    label: "Найти пациента",
    icon: Users,
    href: "/patients",
    accent: "var(--ai-violet)",
  },
  {
    id: "protocol",
    label: "Создать протокол",
    icon: Stethoscope,
    href: "/assistant",
    accent: "var(--ai-success)",
  },
  {
    id: "consult",
    label: "AI Консультация",
    icon: Brain,
    seed: "Нужна консультация по клиническому случаю.",
    accent: "var(--ai-blue)",
  },
];

export function AICommandCenter({ doctorName }: { doctorName?: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    const prompt = value.trim();
    if (!prompt) return;
    openCopilot({ prompt });
    setValue("");
  }

  function runAction(action: QuickAction) {
    if (action.href) {
      router.push(action.href);
      return;
    }
    openCopilot({ prompt: action.seed, command: action.id });
  }

  return (
    <FadeIn>
      <section className="ai-gradient-border premium-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[var(--ai-gradient-soft)] blur-2xl" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-2">
            <span className="ai-orb ai-breathe flex h-7 w-7 items-center justify-center rounded-lg text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-[var(--clinical-foreground-muted)]">
              {doctorName ? `${doctorName}, что хотите сделать?` : "Что хотите сделать?"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[var(--clinical-ring)]">
            <Sparkles className="h-5 w-5 shrink-0 text-[var(--ai-indigo)]" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Опишите задачу: «заключение по O-RADS 4», «найти пациента Иванову»…"
              className="flex-1 bg-transparent text-sm text-[var(--clinical-foreground)] outline-none placeholder:text-[var(--clinical-foreground-muted)]"
              aria-label="Запрос к AI"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="ai-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-white transition disabled:opacity-40"
              aria-label="Отправить запрос"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runAction(action)}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3.5 py-2 text-sm font-medium text-[var(--clinical-foreground)] transition hover:-translate-y-0.5 hover:shadow-md",
                  )}
                >
                  <Icon className="h-4 w-4" style={{ color: action.accent }} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
