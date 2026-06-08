import type { ReactNode } from "react";

import { ClinicalShell } from "@/components/clinical/clinical-shell";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  return <ClinicalShell>{children}</ClinicalShell>;
}
