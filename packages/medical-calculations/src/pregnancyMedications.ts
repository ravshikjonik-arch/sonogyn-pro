/** Справочник лекарств при беременности — образовательный (FDA legacy / КР РФ). */

export type PregnancyDrugCategory = "A" | "B" | "C" | "D" | "X" | "N";

export type PregnancyMedication = {
  id: string;
  name: string;
  nameRu: string;
  category: PregnancyDrugCategory;
  trimesterNotes: string;
  summary: string;
  alternatives?: string;
  searchTerms: string[];
};

export const PREGNANCY_MEDICATIONS: PregnancyMedication[] = [
  {
    id: "folic-acid",
    name: "Folic acid",
    nameRu: "Фолиевая кислота",
    category: "A",
    trimesterNotes: "I–III: профилактика ДНТ с планирования/ранней Б.",
    summary: "400–800 мкг/сут до 12 нед; при риске — 4 мг по протоколу.",
    searchTerms: ["фолиевая", "folic", "витамины"],
  },
  {
    id: "paracetamol",
    name: "Paracetamol / Acetaminophen",
    nameRu: "Парацетамол",
    category: "B",
    trimesterNotes: "Предпочтительный анальгетик/antipyretic во всех триместрах при коротких курсах.",
    summary: "Избегать мегадоз; не смешивать с другими парацетамol-содержащими препаратами.",
    alternatives: "Ибuprofen — избегать III триместр",
    searchTerms: ["парацетамол", "жар", "боль"],
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    nameRu: "Ибuprofen / НПВП",
    category: "D",
    trimesterNotes: "III триместр: противопоказан (закрытие DA). I–II — краткосрочно по показаниям.",
    summary: "Предпочесть парацетамол. НПВП — риск для плода/почек в поздней Б.",
    alternatives: "Парацетамол",
    searchTerms: ["ибuprofen", "нпвп", "дикlofenac"],
  },
  {
    id: "metoclopramide",
    name: "Metoclopramide",
    nameRu: "Метoclopramide / Церукал",
    category: "B",
    trimesterNotes: "Тошнота ранней Б — краткие курсы допустимы по КР.",
    summary: "Контроль дозы и длительности; extrapyramidal effects у матери.",
    searchTerms: ["тошнота", "рвота", "cerucal"],
  },
  {
    id: "labetalol",
    name: "Labetalol",
    nameRu: "Лабetalol",
    category: "C",
    trimesterNotes: "Гипертензия Б / преэклампсия — часто препарат выбора.",
    summary: "Мониторинг АД, роста плода; не отменять без показаний.",
    searchTerms: ["гипертензия", "пreeclampsia", "ад"],
  },
  {
    id: "methyldopa",
    name: "Methyldopa",
    nameRu: "Метildopa",
    category: "B",
    trimesterNotes: "Длительный опыт при ХАГ/Б.",
    summary: "Альтернатива при непереносимости labetalol/nifedipine.",
    searchTerms: ["метildopa", "гипертензия"],
  },
  {
    id: "insulin",
    name: "Insulin",
    nameRu: "Инсulin",
    category: "B",
    trimesterNotes: "ГСД / СД 1–2 типа — препарат выбора.",
    summary: "Титрование по гликемии; не заменять на перoral agents без показаний.",
    searchTerms: ["инсulin", "гсд", "диабет"],
  },
  {
    id: "levothyroxine",
    name: "Levothyroxine",
    nameRu: "L-тироксин",
    category: "A",
    trimesterNotes: "Гипотиреоз — продолжать/корректировать дозу по TSH.",
    summary: "Цель TSH по триместру (КР эндокринологии).",
    searchTerms: ["щитовидка", "tsh", "л-тироксин"],
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    nameRu: "Амoxicillin",
    category: "B",
    trimesterNotes: "Инфекции — часто препарат выбора.",
    summary: "Аллергия на penicillin — альтернативы по протоколу.",
    searchTerms: ["антибиotic", "амoxicillin", "инфекция"],
  },
  {
    id: "ondansetron",
    name: "Ondansetron",
    nameRu: "Оndansetron",
    category: "B",
    trimesterNotes: "Hyperemesis — после неэффективности 1-й линии; обсудить риски I триместра.",
    summary: "Использовать минимальную эффективную дозу; сверка с локальным протоколом.",
    searchTerms: ["рвота", "hyperemesis", "ондансetron"],
  },
  {
    id: "warfarin",
    name: "Warfarin",
    nameRu: "Warfarin",
    category: "X",
    trimesterNotes: "Противопоказан; teratogenic I триместр.",
    summary: "Замена на LMWH/UFH по гемatologу.",
    searchTerms: ["anticoagulant", "варfarin", "кровь"],
  },
  {
    id: "lmwh",
    name: "Enoxaparin / LMWH",
    nameRu: "НМГ (enoxaparin)",
    category: "B",
    trimesterNotes: "Тромboprophylaxis / АФС — по протоколу.",
    summary: "Доза по весу; план родоразрешения (последняя инъекция).",
    searchTerms: ["гепарин", "enoxaparin", "тромбоз"],
  },
  {
    id: "valproate",
    name: "Valproic acid",
    nameRu: "Valproate / Депakine",
    category: "X",
    trimesterNotes: "Противопоказан — высокий риск пороков развития.",
    summary: "Смена antiepileptic до беремenности; folic acid high-dose.",
    searchTerms: ["epilepsy", "valproate", "деpakine"],
  },
  {
    id: "isotretinoin",
    name: "Isotretinoin",
    nameRu: "Isotretinoin / Рoaccutane",
    category: "X",
    trimesterNotes: "Абсолютное противопоказание.",
    summary: "Конtraception 1 мес до/после; pregnancy test.",
    searchTerms: ["roaccutane", "акne", "изotretinoin"],
  },
  {
    id: "misoprostol",
    name: "Misoprostol",
    nameRu: "Misoprostol",
    category: "X",
    trimesterNotes: "Abortifacient — противопокazан в wanted pregnancy.",
    summary: "Только строго по акушерским протоколам в стационаре.",
    searchTerms: ["misoprostol", "простaglandin"],
  },
];

export function searchPregnancyMedications(query: string): PregnancyMedication[] {
  const q = query.trim().toLowerCase();
  if (!q) return PREGNANCY_MEDICATIONS;
  return PREGNANCY_MEDICATIONS.filter(
    (m) =>
      m.nameRu.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.searchTerms.some((t) => t.toLowerCase().includes(q)) ||
      m.summary.toLowerCase().includes(q),
  );
}

export const PREGNANCY_MEDS_DISCLAIMER =
  "Справочник не заменяет формуляр ЛПУ, e-lactancia, UpToDate и решение клинициста. Категории FDA legacy — для ориентира.";

export const CATEGORY_LABELS: Record<PregnancyDrugCategory, string> = {
  A: "A — контролируемые исследования, риск минимален",
  B: "B — нет данных о риске у человека; осторожность",
  C: "C — риск не исключён; только если польза > риска",
  D: "D — доказанный риск; при жизненных показаниях",
  X: "X — противопоказан в беременности",
  N: "N — не классифицирован",
};
