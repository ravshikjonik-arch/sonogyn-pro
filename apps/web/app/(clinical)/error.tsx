"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ClinicalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
        Clinical workspace
      </p>
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Something went wrong</h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        {error.message || "An unexpected error occurred. Your session may still be valid — try again or return home."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()} className="rounded-xl">
          Try again
        </Button>
        <Button type="button" variant="secondary" className="rounded-xl" asChild>
          <a href="/app">Command Center</a>
        </Button>
      </div>
    </div>
  );
}
