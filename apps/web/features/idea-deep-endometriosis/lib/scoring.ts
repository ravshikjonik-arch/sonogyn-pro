import type { IdeaFormValues } from "./schema";

export type AfsCategory = "mild" | "moderate" | "severe";

export type ScoreResult = {
  afsCategory: AfsCategory;
  afsPoints: number;
  /** Предварительное текстовое описание в духе картирования Enzian — не формальный балл Enzian. */
  enzianPreliminary: string;
  rationale: string[];
  structuresAtRisk: string[];
  recommendMri: boolean;
};

const ORGAN_RISK: Record<string, string> = {
  bladder: "стенка мочевого пузыря / дно",
  ureter_right: "мочеточник справа (риск гидронефроза)",
  ureter_left: "мочеточник слева (риск гидронефроза)",
  bowel_rectum: "прямая кишка",
  bowel_sigmoid: "сигмовидная кишка",
  rectovaginal_septum: "ректовагинальная перегородка",
  vagina: "вагина / влагалищный свод",
  uterosacral_ligament_right: "параметрий / крестцово-маточная связка справа",
  uterosacral_ligament_left: "параметрий / крестцово-маточная связка слева",
  torus_uterinus: "торус матки",
};

function sumNoduleVolumeMm3(nodules: IdeaFormValues["step4"]["nodules"]): number {
  return nodules.reduce((acc, n) => acc + n.sizeLengthMm * n.sizeWidthMm * n.sizeHeightMm, 0);
}

/**
 * Упрощённый композитный балл для интерфейса / пропедевтики хирургии.
 * Заменяемый на ML — функция чистая и детерминированная.
 */
export function calculateEndometriosisScore(data: IdeaFormValues): ScoreResult {
  const rationale: string[] = [];
  let points = 0;

  const leftEndo = data.step1.adnexaLeft.endometriomaPresent;
  const rightEndo = data.step1.adnexaRight.endometriomaPresent;
  if (leftEndo || rightEndo) {
    points += 3;
    rationale.push("На УЗИ указана эндометриома яичника(ков).");
  }

  if (data.step1.uterus.adenomyosisSuspicion) {
    points += 1;
    rationale.push("Подозрение на аденомиоз матки.");
  }

  if (data.step2.softMarkers.fixedOvaries) {
    points += 2;
    rationale.push("Фиксация яичников — подозрение на спаечный процесс.");
  }

  if (data.step2.ovarianMobilityRight === "fixed" || data.step2.ovarianMobilityLeft === "fixed") {
    points += 2;
    rationale.push("Фиксация или выраженное ограничение подвижности яичника(ов).");
  }

  const slidingBad =
    data.step3.slidingSign.posteriorCompartment === "absent" ||
    data.step3.slidingSign.posteriorCompartment === "reduced" ||
    data.step3.slidingSign.anteriorCompartment === "absent" ||
    data.step3.slidingSign.anteriorCompartment === "reduced";

  if (slidingBad) {
    points += 2;
    rationale.push("Изменения признака скольжения — повышенное подозрение на глубокий инфильтрирующий эндометриоз.");
  }

  const nodules = data.step4.nodules;
  const deepNodules = nodules.filter((n) => n.depthOfInfiltration !== "superficial");
  points += Math.min(6, nodules.length * 2);
  points += Math.min(4, deepNodules.length);
  if (nodules.length > 0) {
    rationale.push(
      `Отмечено узлов в карте: ${nodules.length}; с паттерном более глубокой инфильтрации (по полям формы): ${deepNodules.length}.`,
    );
  }

  const volume = sumNoduleVolumeMm3(nodules);
  if (volume > 40_000) {
    points += 2;
    rationale.push("Суммарный объём отмеченных узлов повышен (порог модуля, условный).");
  }

  let afsCategory: AfsCategory = "mild";
  if (points >= 9) afsCategory = "severe";
  else if (points >= 4) afsCategory = "moderate";

  const compartments: string[] = [];
  if (data.step3.slidingSign.posteriorCompartment !== "present") compartments.push("задний отдел");
  if (data.step3.slidingSign.anteriorCompartment !== "present") compartments.push("передний отдел");

  const enzianPreliminary =
    nodules.length === 0
      ? "Узлы не нанесены на карту — детальное картирование по классификации Enzian не выполняется в модуле (заглушка)."
      : `Предварительное картирование: ${nodules.length} очаг(а); по правилам скольжения адгезивный рисунок: ${compartments.length ? compartments.join(", ") : "без выраженного «отделённого» паттерна по скольжению"}.`;

  const structuresAtRisk = [...new Set(nodules.map((n) => ORGAN_RISK[n.location] ?? n.location))];

  const ureterBowel = nodules.some((n) =>
    ["ureter_right", "ureter_left", "bowel_rectum", "bowel_sigmoid"].includes(n.location),
  );
  const recommendMri = ureterBowel || deepNodules.length >= 2 || afsCategory === "severe";

  return {
    afsCategory,
    afsPoints: points,
    enzianPreliminary,
    rationale,
    structuresAtRisk,
    recommendMri,
  };
}
