export type ScarScenario = "gynecology" | "early_pregnancy";
export type ScarPregnancyRelation = "not_assessed" | "away_from_scar" | "near_scar" | "implanted_in_scar" | "suspected";
export type ScarStructure = "homogeneous" | "heterogeneous" | "fluid_niche";

export type ScarWorkspaceState = {
  scenario: ScarScenario;
  residualMyometriumMm: number;
  nicheDepthMm: number;
  nicheLengthMm: number;
  nicheWidthMm: number;
  distanceFromInternalOsMm: number;
  gestationalSacDistanceToScarMm: number;
  gestationalSacDistanceToInternalOsMm: number;
  scarPregnancyRelation: ScarPregnancyRelation;
  structure: ScarStructure;
  vascularityAroundSac: boolean;
  bladderSerosaDistanceMm: number;
  notes: string;
};

export const DEFAULT_SCAR_WORKSPACE_STATE: ScarWorkspaceState = {
  scenario: "gynecology",
  residualMyometriumMm: 3.5,
  nicheDepthMm: 7,
  nicheLengthMm: 16,
  nicheWidthMm: 9,
  distanceFromInternalOsMm: 12,
  gestationalSacDistanceToScarMm: 18,
  gestationalSacDistanceToInternalOsMm: 24,
  scarPregnancyRelation: "not_assessed",
  structure: "fluid_niche",
  vascularityAroundSac: false,
  bladderSerosaDistanceMm: 3,
  notes: "",
};

export const SCAR_STRUCTURE_LABELS: Record<ScarStructure, string> = {
  homogeneous: "однородный рубец",
  heterogeneous: "неоднородный рубец",
  fluid_niche: "ниша / жидкостной дефект",
};

export const SCAR_PREGNANCY_RELATION_LABELS: Record<ScarPregnancyRelation, string> = {
  not_assessed: "не оценивалось",
  away_from_scar: "плодное яйцо вне зоны рубца",
  near_scar: "плодное яйцо близко к зоне рубца",
  implanted_in_scar: "плодное яйцо в зоне рубца",
  suspected: "подозрение на беременность в рубце",
};

export function residualRatioPct(state: ScarWorkspaceState): number {
  const denom = state.residualMyometriumMm + state.nicheDepthMm;
  if (denom <= 0) return 0;
  return Math.round((state.residualMyometriumMm / denom) * 100);
}

export function scarRiskHint(state: ScarWorkspaceState): string {
  if (state.residualMyometriumMm < 2.5) {
    return "Остаточный миометрий <2,5 мм — признак тонкого рубца/ниши; требуется клиническая корреляция.";
  }
  if (state.structure !== "homogeneous") {
    return "Структура рубца неоднородная/ниша — описать размеры дефекта и RMT.";
  }
  return "По введённым параметрам критического истончения рубца не отмечено.";
}

export function scarPregnancyHint(state: ScarWorkspaceState): string {
  if (state.scenario !== "early_pregnancy") return "Беременность малого срока не выбрана.";
  if (state.scarPregnancyRelation === "implanted_in_scar" || state.scarPregnancyRelation === "suspected") {
    return "Подозрение на беременность в рубце после КС; нужна целенаправленная ТВУЗИ/ЦДК-оценка, связь с полостью и миометрием к мочевому пузырю.";
  }
  if (state.scarPregnancyRelation === "near_scar" || state.gestationalSacDistanceToScarMm < 5) {
    return "Плодное яйцо расположено близко к зоне рубца; рекомендована контрольная оценка локализации и васкуляризации.";
  }
  return "По схеме плодное яйцо не связано с зоной рубца.";
}

export function buildScarWorkspaceProtocol(state: ScarWorkspaceState): string {
  const lines = [
    state.scenario === "gynecology"
      ? "РУБЕЦ НА МАТКЕ / НИША ПОСЛЕ КС"
      : "РАННЯЯ БЕРЕМЕННОСТЬ И РУБЕЦ ПОСЛЕ КС",
    `Структура рубца: ${SCAR_STRUCTURE_LABELS[state.structure]}.`,
    `Остаточная толщина миометрия (RMT): ${state.residualMyometriumMm.toFixed(1)} мм.`,
    `Глубина ниши: ${state.nicheDepthMm.toFixed(1)} мм; длина ${state.nicheLengthMm.toFixed(1)} мм; ширина ${state.nicheWidthMm.toFixed(1)} мм.`,
    `Расстояние от внутреннего зева до нижнего края дефекта: ${state.distanceFromInternalOsMm.toFixed(1)} мм.`,
    `Индекс остаточного миометрия: ${residualRatioPct(state)}%.`,
    scarRiskHint(state),
  ];

  if (state.scenario === "early_pregnancy") {
    lines.push(
      "",
      "Оценка плодного яйца относительно рубца:",
      `Положение: ${SCAR_PREGNANCY_RELATION_LABELS[state.scarPregnancyRelation]}.`,
      `Расстояние плодного яйца до зоны рубца: ${state.gestationalSacDistanceToScarMm.toFixed(1)} мм.`,
      `Расстояние плодного яйца до внутреннего зева: ${state.gestationalSacDistanceToInternalOsMm.toFixed(1)} мм.`,
      `Миометрий между плодным яйцом и серозой/мочевым пузырём: ${state.bladderSerosaDistanceMm.toFixed(1)} мм.`,
      `Пери/трофобластическая васкуляризация в зоне рубца: ${state.vascularityAroundSac ? "выражена/есть" : "не отмечена или не оценена"}.`,
      scarPregnancyHint(state),
    );
  }

  if (state.notes.trim()) lines.push("", `Комментарий: ${state.notes.trim()}`);
  lines.push("", "Схема является вспомогательной; заключение формирует специалист по данным УЗИ/ЦДК и клинического контекста.");
  return lines.join("\n");
}
