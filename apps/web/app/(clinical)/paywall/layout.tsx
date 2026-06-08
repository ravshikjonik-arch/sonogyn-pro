import type { ReactNode } from "react";
import { Suspense } from "react";

export default function PaywallLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-[var(--clinical-foreground-muted)]">Loading…</div>}>
      {children}
    </Suspense>
  );
}
