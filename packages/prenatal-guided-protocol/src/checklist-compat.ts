import type { ProtocolChecklist, ProtocolWindow } from "./types";

/** Re-export for obstetric-expert thin shim (typecheck needs value/type exports). */
export type { ProtocolChecklist, ProtocolWindow };

/**
 * Coarse trimester checklists (legacy obstetric-expert API).
 * Finding-token addons stay in services/obstetric-expert (domain-specific).
 */
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
      "Хорион / placenta location",
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

export function buildBaseProtocolChecklist(weeks?: number): ProtocolChecklist {
  const window = resolveProtocolWindow(weeks);
  return { ...BASE_CHECKLISTS[window] };
}

export { BASE_CHECKLISTS };
