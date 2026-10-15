"use client";

import { useSafeSentryCapture } from "@/lib/sentry/use-safe-sentry-capture";
import { Button } from "@/components/ui/button";

export default function ClinicalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useSafeSentryCapture(error, { boundary: "clinical-segment" });

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
        Рабочий кабинет
      </p>
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Что-то пошло не так</h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        {error.message || "Произошла ошибка. Попробуйте ещё раз или вернитесь в рабочий кабинет."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()} className="rounded-xl">
          Попробовать снова
        </Button>
        <Button type="button" variant="secondary" className="rounded-xl" asChild>
          <a href="/app">Рабочий кабинет</a>
        </Button>
      </div>
    </div>
  );
}
