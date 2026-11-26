/** Catalog for AI / RAG — no numeric execution in chat; use fmf-core on the page. */
export const FMF_ASSESSMENT_TOOL_DESCRIPTIONS = [
  {
    id: "dating",
    title: "Датирование беременности",
    source: "Robinson & Fleming BJOG 1975 (КТР) · Snijders & Nicolaides UOG 1994 (ОГ)",
  },
  {
    id: "nt",
    title: "Толщина воротникового пространства (ТВП)",
    source: "Wright и соавт. UOG 2008 — смесевая модель",
  },
  {
    id: "growth",
    title: "Рост плода (ПВМ)",
    source: "Wright и соавт. UOG 2018 — кривые веса FMF",
  },
  { id: "bw", title: "Вес при рождении", source: "Wright и соавт. UOG 2018" },
  {
    id: "doppler",
    title: "Допплер плода (ПА/СМА/ЦПС)",
    source: "Референсы FMF (сверка 11.2026)",
  },
  { id: "utpi", title: "PI маточных артерий", source: "Референсы FMF (сверка 11.2026)" },
] as const;

export const FMF_AI_RULES = [
  "Для чисел ТВП, z-оценки, центилей, ГА по КТР/ОГ — только расчётный модуль medical-calculations/fmf; не выдумывать коэффициенты.",
  "Контекст фактов: docs/fmf/FMF_11-13_DIGEST.md (7 разделов).",
  "Справочно, не диагноз; решение за врачом.",
] as const;