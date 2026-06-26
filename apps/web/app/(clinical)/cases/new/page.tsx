"use client";

import { Suspense } from "react";

import { NewCaseWizard } from "@/components/cases/NewCaseWizard";

export default function NewCasePage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <NewCaseWizard />
    </Suspense>
  );
}
