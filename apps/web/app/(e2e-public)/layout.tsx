import type { ReactNode } from "react";

/** E2E demo routes: no ClinicalShell hydrate — stable Playwright smoke on CI. */
export default function E2ePublicLayout({ children }: { children: ReactNode }) {
  return children;
}
