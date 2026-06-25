import type { FindingToken } from "./types";

export type ProtocolWindow = "first_trimester" | "second_trimester" | "third_trimester";

export type ProtocolChecklist = {
  window: ProtocolWindow;
  labelRu: string;
  /** Что обязательно визуализировать */
  visualize: string[];
  /** Что измерить */
  measure: string[];
  /** Красные флаги / нельзя пропустить */
  mustNotMiss: string[];
};

export function resolveProtocolWindow(weeks?: number): ProtocolWindow {
  if (weeks == null || weeks < 14) return "first_trimester";
  if (weeks < 28) return "second_trimester";
  return "third_trimester";
}

const BASE_CHECKLISTS: Record<ProtocolWindow, ProtocolChecklist> = {
  first_trimester: {
    window: "first_trimester",
    labelRu: "ISUOG · I триместр (11–13+6)",
    visualize: [
      "Локализация ПЯ (внутриматочно / исключить эктопию)",
      "Эмбрион, ЧСС, ЖМ",
      "Толщина воротникового пространства (ТВ)",
      "Носовая кость",
      "Руки/ноги, желудок, мочевой пузырь",
      "Хорion / placenta location",
    ],
    measure: [
      "КТР",
      "ТВ (median)",
      "BPD/HC — если ≥13 нед",
      "Nasal bone length",
      "Doppler: DV (PI, A-wave), tricuspid flow",
      "Uterine arteries PI (mean) — по протоколу скрининга",
    ],
    mustNotMiss: [
      "Критерии неудачной беременности (СДПМ, КТР, ЧСС)",
      "Эктопия / CSSP / интерстициальная",
      "Увеличенное ТВ + отсутствие носовой кости",
      "Расширение лоханки >4 mm",
    ],
  },
  second_trimester: {
    window: "second_trimester",
    labelRu: "ISUOG · II триместр (18–22+6)",
    visualize: [
      "22 systematic views (мозг TV/TT/TC, 4CV, LVOT/RVOT/3VT)",
      "Позвоночник sagittal/coronal",
      "Почки, мочевой пузырь, пуповина (3 vessels)",
      "Лицо: profile, orbits, upper lip",
      "Конечности: femur, hands/feet",
      "Placenta, cervix, AFV",
    ],
    measure: [
      "BPD, HC, AC, FL (± HL)",
      "Lateral ventricle atrium (<10 mm)",
      "Cisterna magna (2–10 mm)",
      "Nuchal fold / NF",
      "EFW (Hadlock / INTERGROWTH)",
      "Cervical length при факторах риска",
    ],
    mustNotMiss: [
      "Absent CSP / midline brain",
      "VSD / outflow tract alignment",
      "CDH / CPAM / sequestration",
      "Open spina bifida / lemon sign",
      "Bilateral renal agenesis / severe hydronephrosis",
    ],
  },
  third_trimester: {
    window: "third_trimester",
    labelRu: "ISUOG · III триместр (≥28 нед)",
    visualize: [
      "Presentation, placenta, AFV",
      "Biometry + anatomy spot-check по находке",
      "Doppler UA / MCA / DV при показаниях",
      "Cervix при угрозе преждевременных родов",
    ],
    measure: [
      "BPD, HC, AC, FL — serial",
      "EFW + percentile",
      "AFI / deepest pocket",
      "UA-PI, MCA-PI, CPR, DV-PI",
      "Uterine arteries при ПЭ-риске",
    ],
    mustNotMiss: [
      "FGR / асимметрия роста",
      "Oligohydramnios / polyhydramnios",
      "Hydrops / fetal anemia signs",
      "Placenta previa / vasa previa / accreta spectrum",
    ],
  },
};

/** Дополнительные пункты по токенам находок */
const TOKEN_ADDONS: Partial<
  Record<FindingToken, { visualize: string[]; measure: string[]; mustNotMiss: string[] }>
> = {
  ventriculomegaly: {
    visualize: [
      "CSP — обязательно (coronal + sagittal)",
      "Corpus callosum — sagittal 3D/multislice",
      "Cerebellum / posterior fossa",
    ],
    measure: ["Atrial width both sides", "Cisterna magna", "HC trend"],
    mustNotMiss: ["ACC vs HPE vs SOD", "Associated extracranial anomalies"],
  },
  absent_csp: {
    visualize: ["Sagittal CC", "Frontal horns morphology", "Fused fornices vs CSP"],
    measure: ["Ventricle width", "HC"],
    mustNotMiss: ["Do not confuse fornices with CSP"],
  },
  agenesis_cc: {
    visualize: ["Texas longhorn anterior horns", "Elevated 3rd ventricle", "Colpocephaly"],
    measure: ["Complete CC visualization attempts on 3 planes"],
    mustNotMiss: ["75% associated anomalies — full anatomical survey"],
  },
  holoprosencephaly: {
    visualize: ["Facial profile (cyclopia, proboscis)", "Midline falx absent (alobar)"],
    measure: ["HC — microcephaly progression"],
    mustNotMiss: ["Genetic workup", "Facial anomalies"],
  },
  cdh: {
    visualize: ["Stomach in chest", "Mediastinal shift", "Liver position"],
    measure: ["LHR (lung-to-head ratio) if protocol allows"],
    mustNotMiss: ["Karyotype / associated anomalies", "Fetal echo"],
  },
  hydronephrosis: {
    visualize: ["Both kidneys, bladder cycling", "Ureters if dilated"],
    measure: ["Anterior-posterior renal pelvis diameter", "Amniotic fluid volume"],
    mustNotMiss: ["Bilateral vs unilateral", "Posterior urethral valves in male"],
  },
  increased_nt: {
    visualize: ["Fetal anatomy extended", "Doppler DV/TR"],
    measure: ["NT already done — confirm GA", "Nasal bone"],
    mustNotMiss: ["Combined risk calculation", "Offer NIPT/invasive testing"],
  },
};

export function buildProtocolChecklist(weeks?: number, tokens: FindingToken[] = []): ProtocolChecklist {
  const window = resolveProtocolWindow(weeks);
  const base = BASE_CHECKLISTS[window];
  const extra = { visualize: [] as string[], measure: [] as string[], mustNotMiss: [] as string[] };

  for (const t of tokens) {
    const add = TOKEN_ADDONS[t];
    if (!add) continue;
    extra.visualize.push(...add.visualize);
    extra.measure.push(...add.measure);
    extra.mustNotMiss.push(...add.mustNotMiss);
  }

  const dedupe = (arr: string[]) => [...new Set(arr)];

  return {
    ...base,
    visualize: dedupe([...base.visualize, ...extra.visualize]),
    measure: dedupe([...base.measure, ...extra.measure]),
    mustNotMiss: dedupe([...base.mustNotMiss, ...extra.mustNotMiss]),
  };
}
