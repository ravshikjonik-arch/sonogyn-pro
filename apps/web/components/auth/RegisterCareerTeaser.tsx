import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";

import { CAREER_STAGES } from "@/lib/career/ladder";

/** Мотивация на странице регистрации: путь студент → PRO. */
export function RegisterCareerTeaser() {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--clinical-primary)]/20 bg-[var(--clinical-primary-muted)]/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--clinical-primary)] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Шаг 1 · Студент — регистрация бесплатно</p>
          <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            Шаг 2 — запись на курс (ординатор). Шаг 3 — профиль врача. Шаг 4 — PRO.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CAREER_STAGES.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[var(--clinical-primary-deep)] dark:bg-slate-900/80"
              >
                {s.title}
              </span>
            ))}
          </div>
          <Link
            href="/landing#career-path"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--clinical-primary-deep)] hover:underline"
          >
            Подробнее о пути
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
