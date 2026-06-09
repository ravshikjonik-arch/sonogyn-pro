import type { ReactNode } from "react";

import { canAccessClinicalPhi } from "../lib/security/clinicalAccessGuard";
import ClinicalWebBlockScreen from "../screens/ClinicalWebBlockScreen";

export function ClinicalPhiGate({ children }: { children: ReactNode }) {
  if (!canAccessClinicalPhi()) {
    return <ClinicalWebBlockScreen />;
  }
  return children;
}
