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
    trimesterNotes: "I–III триместр: профилактика дефектов нервной трубки с планирования и ранних сроков.",
    summary: "400–800 мкг/сут до 12 недель; при высоком риске — 4 мг по протоколу.",
    searchTerms: ["фолиевая", "folic", "витамины"],
  },
  {
    id: "paracetamol",
    name: "Paracetamol / Acetaminophen",
    nameRu: "Парацетамол",
    category: "B",
    trimesterNotes: "Предпочтительный анальгетик и жаропонижающее во всех триместрах коротким курсом.",
    summary: "Избегать мегадоз. Не сочетать с другими препаратами, где уже есть парацетамол.",
    alternatives: "Ибупрофен — избегать в III триместре",
    searchTerms: ["парацетамол", "жар", "боль", "acetaminophen"],
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    nameRu: "Ибупрофен",
    category: "D",
    trimesterNotes: "III триместр: противопоказан (риск закрытия артериального протока). I–II — только кратко и по показаниям.",
    summary: "Предпочтительнее парацетамол. НПВП в поздние сроки — риск для почек плода.",
    alternatives: "Парацетамол",
    searchTerms: ["ибупрофен", "нпвп", "диклофенак", "ibuprofen"],
  },
  {
    id: "metoclopramide",
    name: "Metoclopramide",
    nameRu: "Метоклопрамид",
    category: "B",
    trimesterNotes: "Тошнота ранних сроков — короткие курсы допустимы по клиническим рекомендациям.",
    summary: "Контролировать дозу и длительность. У матери возможны экстрапирамидные эффекты.",
    searchTerms: ["тошнота", "рвота", "церукал", "metoclopramide"],
  },
  {
    id: "labetalol",
    name: "Labetalol",
    nameRu: "Лабеталол",
    category: "C",
    trimesterNotes: "Гипертензия беременных и преэклампсия — часто препарат выбора.",
    summary: "Контроль АД и роста плода. Не отменять без показаний.",
    searchTerms: ["гипертензия", "преэклампсия", "ад", "labetalol"],
  },
  {
    id: "methyldopa",
    name: "Methyldopa",
    nameRu: "Метилдопа",
    category: "B",
    trimesterNotes: "Длительный опыт при хронической артериальной гипертензии у беременных.",
    summary: "Альтернатива при непереносимости лабеталола или нифедипина.",
    searchTerms: ["метилдопа", "гипертензия", "methyldopa"],
  },
  {
    id: "insulin",
    name: "Insulin",
    nameRu: "Инсулин",
    category: "B",
    trimesterNotes: "Гестационный диабет и сахарный диабет 1–2 типа — препарат выбора.",
    summary: "Дозу подбирают по гликемии. Пероральные сахароснижающие не подменяют инсулин без показаний.",
    searchTerms: ["инсулин", "гсд", "диабет", "insulin"],
  },
  {
    id: "levothyroxine",
    name: "Levothyroxine",
    nameRu: "Левотироксин",
    category: "A",
    trimesterNotes: "Гипотиреоз: терапию продолжают, дозу корректируют по ТТГ.",
    summary: "Целевой ТТГ зависит от триместра (клинические рекомендации по эндокринологии).",
    searchTerms: ["щитовидка", "ттг", "л-тироксин", "левотироксин"],
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    nameRu: "Амоксициллин",
    category: "B",
    trimesterNotes: "При бактериальной инфекции часто препарат выбора.",
    summary: "При аллергии на пенициллины альтернативу выбирают по протоколу.",
    searchTerms: ["антибиотик", "амоксициллин", "инфекция", "amoxicillin"],
  },
  {
    id: "ondansetron",
    name: "Ondansetron",
    nameRu: "Ондансетрон",
    category: "B",
    trimesterNotes: "Неукротимая рвота — после неэффективности первой линии; в I триместре обсудить риск.",
    summary: "Минимальная эффективная доза. Сверять с локальным протоколом.",
    searchTerms: ["рвота", "hyperemesis", "ондансетрон"],
  },
  {
    id: "warfarin",
    name: "Warfarin",
    nameRu: "Варфарин",
    category: "X",
    trimesterNotes: "Противопоказан. Тератогенен в I триместре.",
    summary: "Замена на низкомолекулярный или нефракционированный гепарин — по решению гематолога.",
    searchTerms: ["антикоагулянт", "варфарин", "кровь", "warfarin"],
  },
  {
    id: "lmwh",
    name: "Enoxaparin / LMWH",
    nameRu: "Низкомолекулярный гепарин",
    category: "B",
    trimesterNotes: "Профилактика тромбозов и антифосфолипидный синдром — по протоколу.",
    summary: "Доза по массе. Перед родами нужен план последней инъекции.",
    searchTerms: ["гепарин", "эноксапарин", "тромбоз", "нмг"],
  },
  {
    id: "valproate",
    name: "Valproic acid",
    nameRu: "Вальпроевая кислота",
    category: "X",
    trimesterNotes: "Противопоказана: высокий риск пороков развития.",
    summary: "Противоэпилептический препарат меняют до беременности. Фолиевая кислота в высокой дозе.",
    searchTerms: ["эпилепсия", "вальпроат", "депакин", "valproate"],
  },
  {
    id: "isotretinoin",
    name: "Isotretinoin",
    nameRu: "Изотретиноин",
    category: "X",
    trimesterNotes: "Абсолютное противопоказание.",
    summary: "Контрацепция за месяц до курса и после него. Тест на беременность до начала.",
    searchTerms: ["роаккутан", "акне", "изотретиноин"],
  },
  {
    id: "misoprostol",
    name: "Misoprostol",
    nameRu: "Мизопростол",
    category: "X",
    trimesterNotes: "Противопоказан, если беременность сохраняют.",
    summary: "Только по акушерскому протоколу в стационаре.",
    searchTerms: ["мизопростол", "простагландин", "misoprostol"],
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

export function getPregnancyMedication(id: string): PregnancyMedication | undefined {
  return PREGNANCY_MEDICATIONS.find((item) => item.id === id);
}

export const PREGNANCY_MEDS_DISCLAIMER =
  "Справочник не заменяет формуляр учреждения, инструкцию препарата и решение лечащего врача. Категории FDA — ориентир, не назначение.";

export const CATEGORY_LABELS: Record<PregnancyDrugCategory, string> = {
  A: "A — риск для плода минимален",
  B: "B — риск у человека не показан, нужна осторожность",
  C: "C — риск не исключён; только если польза выше риска",
  D: "D — риск доказан; при жизненных показаниях",
  X: "X — противопоказан при беременности",
  N: "N — категория не присвоена",
};
