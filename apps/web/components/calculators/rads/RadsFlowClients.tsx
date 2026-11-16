"use client";

import dynamic from "next/dynamic";

function CalcLoading() {
  return (
    <div
      className="p-6 text-sm text-[var(--clinical-foreground-muted)]"
      role="status"
      aria-live="polite"
    >
      Загрузка калькулятора…
    </div>
  );
}

/** Heavy RADS UIs — separate chunks, not in shared first-load graph. */
export const OradsProFlowClient = dynamic(
  () => import("@/components/calculators/orads/OradsProFlow").then((m) => m.OradsProFlow),
  { ssr: false, loading: CalcLoading },
);

export const BreastBiradsHubClient = dynamic(
  () => import("@/components/calculators/birads/BreastBiradsHub").then((m) => m.BreastBiradsHub),
  { ssr: false, loading: CalcLoading },
);

export const TiradsProFlowClient = dynamic(
  () => import("@/components/calculators/tirads/TiradsProFlow").then((m) => m.TiradsProFlow),
  { ssr: false, loading: CalcLoading },
);

export const LnRadsProFlowClient = dynamic(
  () => import("@/components/calculators/lnrads/LnRadsProFlow").then((m) => m.LnRadsProFlow),
  { ssr: false, loading: CalcLoading },
);

export const IotaCalculatorPageClientLazy = dynamic(
  () =>
    import("@/components/calculators/iota/IotaCalculatorPageClient").then(
      (m) => m.IotaCalculatorPageClient,
    ),
  { ssr: false, loading: CalcLoading },
);
