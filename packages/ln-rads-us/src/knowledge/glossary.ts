export type LnGlossaryEntry = {
  term: string;
  termEn?: string;
  definitionRu: string;
  category: "morphology" | "doppler" | "anatomy" | "pathology" | "staging";
};

export const LN_GLOSSARY: LnGlossaryEntry[] = [
  { term: "Hilum", termEn: "Hilum", definitionRu: "Эхогенная центральная зона — жир и сосуды.", category: "morphology" },
  { term: "Cortex", termEn: "Cortex", definitionRu: "Периферическая hypoechoic зона лимфoidной ткани.", category: "morphology" },
  { term: "L/S ratio", definitionRu: "Long axis / short axis; >2 — овальная доброкачественная форма.", category: "morphology" },
  { term: "Eccentric thickening", definitionRu: "Асимметричное утолщение коры — подозрительный признак.", category: "morphology" },
  { term: "Matting", definitionRu: "Слипание/conglomerate узлов.", category: "morphology" },
  { term: "ECE", termEn: "Extracapsular extension", definitionRu: "Extra-capsular spread — стадирование HNSCC/thyroid.", category: "staging" },
  { term: "Hilar flow", definitionRu: "Кровоток через ворота узла — нормальный паттерн.", category: "doppler" },
  { term: "Peripheral flow", definitionRu: "Периферическая васкуляризация — подозрительна.", category: "doppler" },
  { term: "Level VI", definitionRu: "Central compartment neck — pre/paratracheal nodes.", category: "anatomy" },
  { term: "FNA", definitionRu: "Fine needle aspiration — морфологическая верификация.", category: "pathology" },
  { term: "PTC", definitionRu: "Papillary thyroid carcinoma.", category: "pathology" },
  { term: "CEUS", definitionRu: "Contrast-enhanced ultrasound.", category: "doppler" },
  { term: "SWE", definitionRu: "Shear wave elastography.", category: "morphology" },
  { term: "Obturator nodes", definitionRu: "Тазовые узлы по obturator chain — cervix cancer drainage.", category: "anatomy" },
  { term: "Sentinel node", definitionRu: "Первый дренажный ЛУ от первичной опухоли.", category: "staging" },
];

export function searchGlossary(query: string, limit = 12): LnGlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return LN_GLOSSARY.slice(0, limit);
  return LN_GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.termEn?.toLowerCase().includes(q) ||
      g.definitionRu.toLowerCase().includes(q),
  ).slice(0, limit);
}
