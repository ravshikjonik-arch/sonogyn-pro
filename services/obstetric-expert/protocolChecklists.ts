import {
  buildBaseProtocolChecklist,
  resolveProtocolWindow,
  type ProtocolChecklist,
  type ProtocolWindow,
} from "../../packages/prenatal-guided-protocol/src/checklist-compat";

import type { FindingToken } from "./types";

export type { ProtocolChecklist, ProtocolWindow };
export { resolveProtocolWindow };

/** Дополнительные пункты по токенам находок (domain obstetric-expert). */
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
  const base = buildBaseProtocolChecklist(weeks);
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
