import type { FetalDopplerGlossaryEntry } from "./types";

export const FETAL_DOPPLER_GLOSSARY: FetalDopplerGlossaryEntry[] = [
  {
    term: "ALARA",
    aliases: ["As Low As Reasonably Achievable"],
    definition: "Принцип минимальной разумной экспозиции ультразвука и допплера.",
    sectionIds: ["safety"],
  },
  {
    term: "TI",
    aliases: ["Thermal Index"],
    definition: "Термический индекс аппарата; при допплере I триместра держать ≤ 1.0.",
    sectionIds: ["safety"],
  },
  {
    term: "4CV",
    aliases: ["Four-chamber view", "4-камерный срез"],
    definition: "Срез сердца с четырьмя камерами для оценки наполнения и симметрии.",
    sectionIds: ["fetal-heart"],
  },
  {
    term: "3VT",
    aliases: ["Three-vessel trachea view", "3-сосудисто-трахеальный срез"],
    definition: "Срез с аортой, лёгочной артерией и верхней полой веной.",
    sectionIds: ["fetal-heart"],
  },
  {
    term: "TR",
    aliases: ["Tricuspid regurgitation", "Трикуспидальная регургитация"],
    definition: "Обратный поток через трикуспидальный клапан; измеряется импульсным допплером по показаниям.",
    sectionIds: ["fetal-heart"],
  },
  {
    term: "VP",
    aliases: ["Ductus venosus", "Венозный проток"],
    definition: "Сосуд между пупочной веной и правым предсердием; PI и A-wave — ключевые маркеры.",
    sectionIds: ["ductus-venosus"],
  },
  {
    term: "PI",
    aliases: ["Pulsatility Index", "Индекс пульсации"],
    definition: "(PSV − EDV) / MV; используется для VP и маточных артерий.",
    sectionIds: ["ductus-venosus", "uterine-arteries"],
  },
  {
    term: "A-wave",
    aliases: ["Atrial wave"],
    definition: "Компонента допплер-кривой VP, отражающая atrial kick; в норме antegrade.",
    sectionIds: ["ductus-venosus"],
  },
  {
    term: "SUA",
    aliases: ["Single umbilical artery", "Единственная пупочная артерия"],
    definition: "Наличие одной артерии вместо двух в пуповине; скрининговая находка.",
    sectionIds: ["umbilical-arteries"],
  },
  {
    term: "3-vessel cord",
    definition: "Нормальная пуповина: 2 артерии + 1 вена.",
    sectionIds: ["umbilical-arteries"],
  },
  {
    term: "Omphalocele",
    aliases: ["Омфaloцеле"],
    definition: "Срединный дефект АБС с мемbranous sac; пуповина часто на вершине.",
    sectionIds: ["umbilical-ring"],
  },
  {
    term: "Gastroschisis",
    aliases: ["Гастроshisis"],
    definition: "Paraumbilical defect без мемbranous sac; free loops кишечника.",
    sectionIds: ["umbilical-ring"],
  },
  {
    term: "UTA PI",
    aliases: ["Uterine artery PI", "PI маточных артерий"],
    definition: "PI маточных артерий на уровне internal os; часть PE screening.",
    sectionIds: ["uterine-arteries"],
  },
  {
    term: "FMF",
    definition: "Fetal Medicine Foundation — протоколы скрининга I триместра.",
    sectionIds: ["introduction", "five-positions"],
  },
  {
    term: "Color Doppler",
    aliases: ["ЦДК", "Color flow"],
    definition: "Режим визуализации направления и скорости потока; первый шаг перед спектральным допплером.",
    sectionIds: ["safety", "five-positions"],
  },
  {
    term: "Pulsed Doppler",
    aliases: ["Импульсный допплер", "Spectral Doppler"],
    definition: "Спектральный допплер для количественных измерений PI и описания waveform.",
    sectionIds: ["safety"],
  },
];

export function searchGlossary(query: string): FetalDopplerGlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return FETAL_DOPPLER_GLOSSARY;
  return FETAL_DOPPLER_GLOSSARY.filter((entry) => {
    const hay = [entry.term, ...(entry.aliases ?? []), entry.definition].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
