"use client";

import { FmfCalculators } from "@/components/fmf/FmfCalculators";
import { FmfScreening11Client } from "@/components/fmf/FmfScreening11Client";

/**
 * FMF 11–13: учебный контент + учебный риск (fmfScreening) + assessment (fmf-core).
 */
export function Fmf1113UnifiedClient() {
  return (
    <div className="space-y-10">
      <FmfScreening11Client />
      <hr className="border-[var(--clinical-border)]" />
      <FmfCalculators />
    </div>
  );
}