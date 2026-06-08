import type { POPQStageKey } from "./prolapseLogic";
import i18n from "../i18n";

export function popqStageLabel(stageKey: POPQStageKey): string {
  if (stageKey === "na") return "—";
  if (stageKey === "0") return i18n.t("prolapse_popq_stage_0");
  if (stageKey === "1") return i18n.t("prolapse_popq_stage_1");
  if (stageKey === "2") return i18n.t("prolapse_popq_stage_2");
  if (stageKey === "3") return i18n.t("prolapse_popq_stage_3");
  return i18n.t("prolapse_popq_stage_4");
}
