import type { ReactNode } from "react";

/** Layout retained for legacy `/landing` → `/` redirect only. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return children;
}
