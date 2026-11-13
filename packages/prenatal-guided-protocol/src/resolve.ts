import {
  emptyT1Fields,
  emptyT2Fields,
  isT1Window,
  type GuidedFields,
} from "./fields";
import { getStepsForWindow } from "./steps";
import type { GuidedStep } from "./types";
import { CDS_DISCLAIMER_RU } from "./types";
import {
  approximateGaDaysFromCrlMm,
  gaDaysFromWeeksDays,
  resolveGuidedWindow,
  stepsCatalogWindowId,
  type ResolveWindowResult,
} from "./windows";

export type ResolveGuidedProtocolInput = {
  gaWeeks?: number;
  gaDaysPart?: number;
  /** Total days if already known */
  gaDaysTotal?: number;
  crlMm?: number;
};

export type GuidedProtocolResolved = {
  window: ResolveWindowResult;
  catalogWindowId: Exclude<ResolveWindowResult["windowId"], "between_windows">;
  steps: GuidedStep[];
  emptyFields: GuidedFields;
  disclaimerRu: string;
};

export function resolveGaDaysTotal(input: ResolveGuidedProtocolInput): number | null {
  if (input.gaDaysTotal != null && Number.isFinite(input.gaDaysTotal)) {
    return Math.max(0, Math.floor(input.gaDaysTotal));
  }
  if (input.gaWeeks != null && Number.isFinite(input.gaWeeks)) {
    return gaDaysFromWeeksDays(input.gaWeeks, input.gaDaysPart ?? 0);
  }
  if (input.crlMm != null) {
    return approximateGaDaysFromCrlMm(input.crlMm);
  }
  return null;
}

export function resolveGuidedProtocol(
  input: ResolveGuidedProtocolInput,
): GuidedProtocolResolved | { error: string } {
  const gaDays = resolveGaDaysTotal(input);
  if (gaDays == null) {
    return { error: "Укажите срок (нед+дн) или КТР для выбора сценария." };
  }

  const window = resolveGuidedWindow(gaDays);
  const catalogWindowId = stepsCatalogWindowId(window);
  const steps = getStepsForWindow(catalogWindowId);
  const emptyFields = isT1Window(catalogWindowId) ? emptyT1Fields() : emptyT2Fields();

  return {
    window,
    catalogWindowId,
    steps,
    emptyFields,
    disclaimerRu: CDS_DISCLAIMER_RU,
  };
}
