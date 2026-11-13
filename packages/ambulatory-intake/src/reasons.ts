export type VisitReasonId =
  | "primary"
  | "followup"
  | "preventive"
  | "dispensarization"
  | "pregnancy"
  | "cycle"
  | "pelvic_pain"
  | "discharge"
  | "bleeding"
  | "infertility"
  | "cervix"
  | "breast"
  | "menopause"
  | "other";

export type VisitReason = {
  id: VisitReasonId;
  labelRu: string;
  /** Linked clinical scenario algorithm ids */
  scenarioIds: string[];
  hubGroup: "visit_type" | "complaint";
};

export const VISIT_REASONS: VisitReason[] = [
  { id: "primary", labelRu: "Первичный приём", scenarioIds: ["primary"], hubGroup: "visit_type" },
  { id: "followup", labelRu: "Повторный приём", scenarioIds: ["followup"], hubGroup: "visit_type" },
  { id: "preventive", labelRu: "Профилактический осмотр", scenarioIds: ["preventive"], hubGroup: "visit_type" },
  {
    id: "dispensarization",
    labelRu: "Диспансеризация",
    scenarioIds: ["dispensarization", "dorz"],
    hubGroup: "visit_type",
  },
  { id: "pregnancy", labelRu: "Беременность", scenarioIds: ["pregnancy"], hubGroup: "complaint" },
  { id: "cycle", labelRu: "Нарушение менструального цикла", scenarioIds: ["cycle", "aub", "pcos"], hubGroup: "complaint" },
  { id: "pelvic_pain", labelRu: "Боль внизу живота", scenarioIds: ["pelvic_pain", "pid", "endometriosis"], hubGroup: "complaint" },
  { id: "discharge", labelRu: "Патологические выделения", scenarioIds: ["vv", "sti"], hubGroup: "complaint" },
  { id: "bleeding", labelRu: "Кровянистые выделения", scenarioIds: ["aub"], hubGroup: "complaint" },
  { id: "infertility", labelRu: "Бесплодие", scenarioIds: ["infertility", "pcos"], hubGroup: "complaint" },
  { id: "cervix", labelRu: "Патология шейки матки", scenarioIds: ["cervix"], hubGroup: "complaint" },
  { id: "breast", labelRu: "Патология молочных желёз", scenarioIds: ["breast"], hubGroup: "complaint" },
  { id: "menopause", labelRu: "Менопаузальные симптомы", scenarioIds: ["menopause"], hubGroup: "complaint" },
  { id: "other", labelRu: "Другая причина", scenarioIds: ["primary"], hubGroup: "complaint" },
];

export function getReason(id: VisitReasonId): VisitReason | undefined {
  return VISIT_REASONS.find((r) => r.id === id);
}
