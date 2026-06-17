export type PlacentaLocation =
  | "anterior"
  | "posterior"
  | "fundal"
  | "left_lateral"
  | "right_lateral"
  | "low";

export type CordInsertion = "central" | "marginal" | "velamentous" | "unknown";

export type VasaRelation = "none" | "near_os" | "over_os" | "suspected";

export type PlacentaVasaState = {
  placentaLocation: PlacentaLocation;
  placentalEdgeDistanceMm: number;
  placentaCoversInternalOs: boolean;
  cordInsertion: CordInsertion;
  accessoryPlacentalLobe: boolean;
  fetalVesselsNearInternalOs: boolean;
  vesselDistanceToInternalOsMm: number;
  vasaRelation: VasaRelation;
  notes: string;
};

export const DEFAULT_PLACENTA_VASA_STATE: PlacentaVasaState = {
  placentaLocation: "posterior",
  placentalEdgeDistanceMm: 28,
  placentaCoversInternalOs: false,
  cordInsertion: "unknown",
  accessoryPlacentalLobe: false,
  fetalVesselsNearInternalOs: false,
  vesselDistanceToInternalOsMm: 35,
  vasaRelation: "none",
  notes: "",
};

export const PLACENTA_LOCATION_LABELS: Record<PlacentaLocation, string> = {
  anterior: "по передней стенке",
  posterior: "по задней стенке",
  fundal: "в дне матки",
  left_lateral: "по левой боковой стенке",
  right_lateral: "по правой боковой стенке",
  low: "низко расположена",
};

export const CORD_INSERTION_LABELS: Record<CordInsertion, string> = {
  central: "центральное",
  marginal: "краевое",
  velamentous: "оболочечное",
  unknown: "не уточнено",
};

export const VASA_RELATION_LABELS: Record<VasaRelation, string> = {
  none: "признаков vasa previa не выявлено",
  near_os: "сосуды расположены близко к внутреннему зеву",
  over_os: "сосуды проецируются над внутренним зевом",
  suspected: "подозрение на vasa previa",
};

export function classifyPlacentalEdge(state: PlacentaVasaState): string {
  if (state.placentaCoversInternalOs || state.placentalEdgeDistanceMm < 0) {
    return "Плацента перекрывает область внутреннего зева — признаки предлежания плаценты.";
  }
  if (state.placentalEdgeDistanceMm < 20) {
    return "Нижний край плаценты расположен менее 20 мм от внутреннего зева — низкое расположение плаценты.";
  }
  return "Нижний край плаценты расположен на 20 мм и более от внутреннего зева.";
}

export function classifyVasaPreviaRisk(state: PlacentaVasaState): string {
  if (state.vasaRelation === "over_os") {
    return "Фетальные сосуды проецируются над областью внутреннего зева — признаки vasa previa; требуется подтверждение ЦДК/ТВУЗИ.";
  }
  if (state.vasaRelation === "suspected" || state.fetalVesselsNearInternalOs) {
    return "Есть подозрение на vasa previa / сосуды вблизи внутреннего зева; требуется целенаправленная оценка ЦДК.";
  }
  if (state.vasaRelation === "near_os" || state.vesselDistanceToInternalOsMm < 20) {
    return "Фетальные сосуды расположены близко к внутреннему зеву (<20 мм); рекомендована контрольная оценка ЦДК.";
  }
  return "Данных за vasa previa по схеме не получено.";
}

export function buildPlacentaVasaProtocolBlock(state: PlacentaVasaState): string {
  const lines = [
    `Плацента ${PLACENTA_LOCATION_LABELS[state.placentaLocation]}.`,
    state.placentaCoversInternalOs
      ? "Нижний край плаценты перекрывает область внутреннего зева."
      : `Нижний край плаценты расположен на ${Math.round(state.placentalEdgeDistanceMm)} мм от внутреннего зева.`,
    classifyPlacentalEdge(state),
    `Прикрепление пуповины: ${CORD_INSERTION_LABELS[state.cordInsertion]}.`,
  ];

  if (state.accessoryPlacentalLobe) {
    lines.push("Отмечена добавочная доля плаценты / междолевая сосудистая зона — оценить сосуды между долями.");
  }

  lines.push(
    `Фетальные сосуды относительно внутреннего зева: ${VASA_RELATION_LABELS[state.vasaRelation]}.`,
    `Минимальное расстояние сосудов до внутреннего зева: ${Math.round(state.vesselDistanceToInternalOsMm)} мм.`,
    classifyVasaPreviaRisk(state),
  );

  if (state.notes.trim()) {
    lines.push(`Комментарий: ${state.notes.trim()}`);
  }

  lines.push("Заключение по схеме является вспомогательным; финальная оценка — по УЗИ с ЦДК/ТВУЗИ и клиническому контексту.");
  return lines.join("\n");
}
