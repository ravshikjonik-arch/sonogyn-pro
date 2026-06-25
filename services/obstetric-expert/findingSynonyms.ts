import type { BiometricData, DopplerData, FindingToken } from "./types";

/** RU/EN синонимы → канонический токен для правил и скoring. */
export const FINDING_SYNONYMS: Record<FindingToken, string[]> = {
  ventriculomegaly: [
    "ventriculomegaly",
    "ventriculomegalia",
    "вентрикуломегалия",
    "умеренная вентрикуломегалия",
    "mild ventriculomegaly",
    "dilatation of lateral ventricle",
    "расширение боковых ventricles",
    "атриальное расширение",
    "атрии > 10",
    "13 mm",
    "10 mm",
  ],
  absent_csp: [
    "absent csp",
    "absent cavum",
    "absent cavum septi pellucidi",
    "no csp",
    "отсутствует csp",
    "отсутствует cavum",
    "отсутствует cavum septi pellucidi",
    "отсутствие csp",
    "нет csp",
    "нет полости прозрачной перегородки",
    "отсутствует полость прозрачной перегородки",
    "отсутствие полости прозрачной перегородки",
    "csp absent",
    "nonvisualization of csp",
    "нет csp",
  ],
  agenesis_cc: [
    "agenesis corpus callosum",
    "agenesis of corpus callosum",
    "agenesis/dysgenesis of the corpus callosum",
    "агенезия мозолистого тела",
    "дисгенез мозолистого тела",
    "acc",
    "absent corpus callosum",
    "nonvisualization of cc",
    "texas longhorn",
    "colpocephaly",
    "параллельные передние рога",
  ],
  holoprosencephaly: [
    "holoprosencephaly",
    "hpe",
    "гольопrosencephalia",
    "голопросенцефалия",
    "alobar holoprosencephaly",
    "lobar holoprosencephaly",
    "semilobar holoprosencephaly",
  ],
  septo_optic_dysplasia: [
    "septo-optic dysplasia",
    "septo optic dysplasia",
    "sod",
    "септо-оптическая дисплазия",
    "септооптическая дисплазия",
    "dysplasia septo-optica",
  ],
  microcephaly: [
    "microcephaly",
    "микроцефалия",
    "small head",
    "уменьшенный бипариетальный размер",
  ],
  choroid_plexus_cyst: [
    "choroid plexus cyst",
    "киста сосудистого сплетения",
    "cpc",
  ],
  increased_nt: [
    "increased nt",
    "thick nt",
    "толстый тв",
    "увеличенная толщина воротникового пространства",
    "nt > 3",
  ],
  absent_nasal_bone: [
    "absent nasal bone",
    "отсутствует носовая кость",
    "hypoplastic nasal bone",
  ],
  tricuspid_regurgitation: [
    "tricuspid regurgitation",
    "трикуспидальная регurgитация",
    "tricuspid valve regurgitation",
  ],
  reversed_dv_a_wave: [
    "reversed a wave",
    "reversed dv flow",
    "инвертированная a-волна",
    "dv a-wave absent",
    "отсутствие a-волны в венозном протоке",
  ],
  cdh: [
    "congenital diaphragmatic hernia",
    "cdh",
    "врожденная диафрагмальная грыжа",
    "диафрагмальная грыжа",
  ],
  vsd: [
    "ventricular septal defect",
    "vsd",
    "дефект межжелудочковой перегородки",
    "дмжп",
  ],
  hydronephrosis: [
    "hydronephrosis",
    "гидронефроз",
    "renal pelvis dilatation",
    "расширение лоханки",
  ],
  echogenic_bowel: [
    "echogenic bowel",
    "эхогенный кишечник",
    "hyperechoic bowel",
  ],
  echogenic_focus: [
    "echogenic focus",
    "echogenic intracardiac focus",
    "эхогенный фокус",
    "эхогенный фокус в сердце",
    "eif",
  ],
  short_fl: [
    "short femur",
    "укорочение бедренной кости",
    "short fl",
    "укорочение fl",
  ],
  short_hl: [
    "short humerus",
    "укорочение плечевой кости",
    "short hl",
  ],
  pyelectasis: [
    "pyelectasis",
    "renal pelvis dilatation",
    "расширение лоханки",
    "pyelectasis",
  ],
  polyhydramnios: [
    "polyhydramnios",
    "многоводие",
  ],
  oligohydramnios: [
    "oligohydramnios",
    "маловодие",
  ],
  hydrops: [
    "hydrops",
    "гидропс",
    "водянка плода",
    "fetal hydrops",
  ],
  single_umbilical_artery: [
    "single umbilical artery",
    "sua",
    "одна артерия пуповины",
    "одноканальная пуповина",
  ],
};

const TOKEN_LOOKUP: { pattern: RegExp; token: FindingToken }[] = [];

for (const [token, phrases] of Object.entries(FINDING_SYNONYMS)) {
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    TOKEN_LOOKUP.push({ pattern: new RegExp(escaped, "i"), token });
  }
}

export function normalizeFindingText(text: string): FindingToken[] {
  const lower = text.toLowerCase().trim();
  const found = new Set<FindingToken>();
  for (const { pattern, token } of TOKEN_LOOKUP) {
    if (pattern.test(lower)) found.add(token);
  }
  return [...found];
}

export function normalizeFindings(findings: string[]): FindingToken[] {
  const all = new Set<FindingToken>();
  for (const f of findings) {
    for (const t of normalizeFindingText(f)) all.add(t);
  }
  return [...all];
}

export function tokensFromBiometrics(data?: BiometricData): FindingToken[] {
  if (!data) return [];
  const tokens: FindingToken[] = [];
  if (data.lateralVentricleMm != null && data.lateralVentricleMm >= 10) {
    tokens.push("ventriculomegaly");
  }
  return tokens;
}

export function tokensFromDoppler(data?: DopplerData | DopplerData[]): FindingToken[] {
  const list = Array.isArray(data) ? data : data ? [data] : [];
  const tokens: FindingToken[] = [];
  for (const d of list) {
    if (d.dvPi != null && d.notes?.toLowerCase().includes("a-wave")) {
      tokens.push("reversed_dv_a_wave");
    }
    if (d.notes?.toLowerCase().includes("tricuspid")) {
      tokens.push("tricuspid_regurgitation");
    }
  }
  return tokens;
}

export function collectAllTokens(
  findings: string[],
  biometricData?: BiometricData,
  dopplerData?: DopplerData | DopplerData[],
): FindingToken[] {
  return [
    ...new Set([
      ...normalizeFindings(findings),
      ...tokensFromBiometrics(biometricData),
      ...tokensFromDoppler(dopplerData),
    ]),
  ];
}
