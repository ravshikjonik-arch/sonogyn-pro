/** Catalog for AI / RAG — no numeric execution in chat; use fmf-core on the page. */
export const FMF_ASSESSMENT_TOOL_DESCRIPTIONS = [
  {
    id: "dating",
    title: "Pregnancy dating",
    source: "Robinson & Fleming BJOG 1975 (CRL) · Snijders & Nicolaides UOG 1994 (HC)",
  },
  {
    id: "nt",
    title: "Nuchal translucency",
    source: "Wright et al. UOG 2008 mixture model",
  },
  {
    id: "growth",
    title: "Fetal growth (EFW)",
    source: "Wright et al. UOG 2018 FMF weight charts",
  },
  { id: "bw", title: "Birth weight", source: "Wright et al. UOG 2018" },
  {
    id: "doppler",
    title: "Fetal Doppler UA/MCA/CPR",
    source: "FMF reference ranges (verified 2026-11)",
  },
  { id: "utpi", title: "Uterine artery PI", source: "FMF reference ranges (verified 2026-11)" },
] as const;

export const FMF_AI_RULES = [
  "Для чисел NT, z-score, центилей, GA по CRL/HC — только движок @repo/medical-calculations/fmf/fmf-core; не выдумывать коэффициенты.",
  "Контекст фактов: docs/fmf/FMF_11-13_DIGEST.md (7 разделов).",
  "Справочно, не диагноз; решение за врачом.",
] as const;