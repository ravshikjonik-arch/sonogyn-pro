/**
 * Русские подписи для значений формы IDEA (в JSON хранятся enum-ключи).
 * Клинические термины УЗИ/АГ; при расхождении с локальным протоколом — править здесь.
 */

import type { IdeaFormValues } from "./schema";

export const boolRu = (v: boolean) => (v ? "да" : "нет");

const uterusPosition: Record<IdeaFormValues["step1"]["uterus"]["position"], string> = {
  anteverted: "антеверсия",
  retroverted: "ретроверсия",
  mid: "среднее положение",
};

const uterusSize: Record<IdeaFormValues["step1"]["uterus"]["size"], string> = {
  normal: "нормальные размеры",
  enlarged: "увеличена",
};

const myometrium: Record<IdeaFormValues["step1"]["uterus"]["myometrium"], string> = {
  homogeneous: "однородный",
  heterogeneous: "неоднородный",
};

const ovaryVisibility: Record<IdeaFormValues["step1"]["adnexaRight"]["ovaryVisibility"], string> = {
  visible: "визуализируется",
  not_visualized: "не визуализируется",
  partial: "частично",
};

const ovarySize: Record<IdeaFormValues["step1"]["adnexaRight"]["ovarySize"], string> = {
  normal: "размеры в пределах нормы",
  enlarged: "увеличена",
};

const cystChar: Record<string, string> = {
  unilocular: "унилокулярная",
  multilocular: "мультилокулярная",
  ground_glass: "эхогенность «матового стекла»",
};

const mobility: Record<IdeaFormValues["step2"]["ovarianMobilityRight"], string> = {
  mobile: "подвижна",
  reduced_mobility: "снижена подвижность",
  fixed: "фиксирована",
};

const sliding: Record<IdeaFormValues["step3"]["slidingSign"]["anteriorCompartment"], string> = {
  present: "сохранён (нормальное скольжение)",
  absent: "отсутствует",
  reduced: "снижен",
};

const depth: Record<IdeaFormValues["step4"]["nodules"][number]["depthOfInfiltration"], string> = {
  superficial: "поверхностная / субсерозная",
  muscular: "мышечный слой",
  submucosal: "субмукозная",
};

const shape: Record<IdeaFormValues["step4"]["nodules"][number]["shape"], string> = {
  nodular: "узелковая",
  plaque: "бляшкообразная",
  stellate: "звёздчатая",
};

const doppler: Record<IdeaFormValues["step4"]["nodules"][number]["vascularizationDoppler"], string> = {
  minimal: "минимальная",
  moderate: "умеренная",
  abundant: "выраженная",
};

const noduleLoc: Record<IdeaFormValues["step4"]["nodules"][number]["location"], string> = {
  rectovaginal_septum: "ректовагинальная перегородка",
  uterosacral_ligament_right: "связка матки справа (крестцово-маточная)",
  uterosacral_ligament_left: "связка матки слева (крестцово-маточная)",
  torus_uterinus: "торус матки",
  bladder: "стенка мочевого пузыря / дно",
  ureter_right: "мочеточник справа",
  ureter_left: "мочеточник слева",
  bowel_rectum: "кишка — прямая кишка",
  bowel_sigmoid: "кишка — сигмовидная",
  vagina: "вагина / влагалищный свод",
};

export function ruUterusLine(u: IdeaFormValues["step1"]["uterus"]): string {
  return `Матка: ${uterusPosition[u.position]}, ${uterusSize[u.size]}, миометрий ${myometrium[u.myometrium]}; подозрение на аденомиоз: ${boolRu(u.adenomyosisSuspicion)}.`;
}

export function ruAdnexaLine(side: "справа" | "слева", a: IdeaFormValues["step1"]["adnexaRight"]): string {
  const cyst =
    a.cystCharacteristics.length > 0 ? a.cystCharacteristics.map((c) => cystChar[c] ?? c).join(", ") : "не указано";
  return `Придатки ${side}: яичник ${ovaryVisibility[a.ovaryVisibility]}, ${ovarySize[a.ovarySize]}; эндометриома: ${boolRu(a.endometriomaPresent)}; кистозный паттерн: ${cyst}.`;
}

export function ruSlidingLine(s: IdeaFormValues["step3"]["slidingSign"]): string {
  return `Признак скольжения (sliding sign) — передний отдел: ${sliding[s.anteriorCompartment]}; задний: ${sliding[s.posteriorCompartment]}; ямка справа: ${sliding[s.rightOvarianFossa]}; ямка слева: ${sliding[s.leftOvarianFossa]}.`;
}

export function ruMobility(m: IdeaFormValues["step2"]["ovarianMobilityRight"]): string {
  return mobility[m];
}

export function ruDiagramRegions(ids: string[]): string {
  const map: Record<string, string> = {
    anterior_compartment: "передний отдел (матка — пузырь)",
    posterior_compartment: "задний отдел (матка — прямая кишка)",
    right_adnexa: "правая яичниковая ямка",
    left_adnexa: "левая яичниковая ямка",
  };
  if (ids.length === 0) return "Отметки на схеме не выбраны.";
  return `Выбранные зоны на схеме: ${ids.map((id) => map[id] ?? id).join("; ")}.`;
}

export function ruNoduleLine(n: IdeaFormValues["step4"]["nodules"][number], index: number): string {
  const pen = n.penelopeScore != null ? `; Penelope ${n.penelopeScore}` : "";
  return `#${index + 1} ${noduleLoc[n.location]}: ${n.sizeLengthMm}×${n.sizeWidthMm}×${n.sizeHeightMm} мм, инфильтрация — ${depth[n.depthOfInfiltration]}, форма — ${shape[n.shape]}, болезненность ${boolRu(n.associatedTenderness)}, васкуляризация по Допплеру — ${doppler[n.vascularizationDoppler]}${pen}.`;
}

export const severityRu: Record<"mild" | "moderate" | "severe", string> = {
  mild: "лёгкая",
  moderate: "умеренная",
  severe: "выраженная",
};

export function ruAfsCategory(cat: "mild" | "moderate" | "severe"): string {
  switch (cat) {
    case "mild":
      return "лёгкая (условная категория по правилам модуля)";
    case "moderate":
      return "умеренная (условная категория по правилам модуля)";
    case "severe":
      return "тяжёлая (условная категория по правилам модуля)";
    default: {
      const _e: never = cat;
      return _e;
    }
  }
}
