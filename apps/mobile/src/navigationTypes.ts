export type PageType =
  | "home"
  | "orads"
  | "birads"
  | "feedback"
  | "stages"
  | "ai"
  | "chat"
  | "gyn_hub"
  | "gyn_assistant_gynecology"
  | "gyn_assistant_obstetrics"
  | "gyn_ga_lmp"
  | "gyn_ga_us"
  | "gyn_ga_ovo_ivf"
  | "gyn_dekret"
  | "gyn_ga_crl"
  | "gyn_ga_feto"
  | "gyn_breast_risk"
  | "gyn_lnrads"
  | "gyn_figo_fibroid"
  | "gyn_uterus_clinic"
  | "gyn_medvedev_consensus";

export const SECTION_TITLE: Record<Exclude<PageType, "home">, string> = {
  orads: "O-RADS — яичники",
  birads: "BI-RADS — молочная железа",
  chat: "Чат врачей УЗД",
  ai: "AI анализ (beta)",
  stages: "Стадии O-RADS",
  feedback: "Обратная связь",
  gyn_hub: "Для гинеколога",
  gyn_assistant_gynecology: "Помощник врача-гинеколога",
  gyn_assistant_obstetrics: "Помощник акушера",
  gyn_ga_lmp: "Срок по менструации",
  gyn_ga_us: "Срок по УЗИ",
  gyn_ga_ovo_ivf: "Овуляция и ЭКО",
  gyn_dekret: "Декрет (ориентиры)",
  gyn_ga_crl: "Срок по КТР",
  gyn_ga_feto: "Срок по фетометрии",
  gyn_breast_risk: "Риск рака МЖ (образовательно)",
  gyn_lnrads: "LN-RADS — лимфоузлы",
  gyn_figo_fibroid: "FIGO — миоматозный узел",
  gyn_uterus_clinic: "Матка — FIGO + аденомиоз / DIE",
  gyn_medvedev_consensus: "Консенсусы УЗИ (Medvedev 2018)",
};

export function isGynecologyPage(p: PageType): boolean {
  return p === "gyn_hub" || p.startsWith("gyn_");
}
