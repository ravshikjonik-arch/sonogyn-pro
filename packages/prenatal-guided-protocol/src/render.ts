import type { GuidedT1Fields, GuidedT2Fields } from "./fields";
import { isT1Window } from "./fields";
import type { GuidedWindowId } from "./types";
import { CDS_DISCLAIMER_RU } from "./types";

function v(value: unknown, blank = "___"): string {
  if (value == null) return blank;
  if (typeof value === "number" && (Number.isNaN(value) || !Number.isFinite(value))) return blank;
  if (typeof value === "string" && !value.trim()) return blank;
  return String(value);
}

function anatomyLine(label: string, status: string | undefined | null): string {
  if (!status || status === "") return `${label}: ___`;
  if (status === "ok") return `${label}: патологии не выявлено`;
  if (status === "not_assessed") return `${label}: не оценено`;
  return `${label}: см. описание (отклонение)`;
}

export function renderT1ProtocolText(fields: GuidedT1Fields, gaLabel?: string): string {
  const lines: string[] = [
    "ПРОТОКОЛ · I пренатальный скрининг (SonoGyn Guided)",
    `Срок: ${gaLabel ?? `${v(fields.gaByCrlWeeks)} нед. + ${v(fields.gaByCrlDays)} дн.`}`,
    "",
    "— Шапка —",
    `Дата: ${v(fields.examDate)} · ЛПУ: ${v(fields.facility)}`,
    `УЗ-сканер: ${v(fields.scanner)} · Датчик: ${v(fields.probe)} · Визуализация: ${v(fields.visualization)}`,
    "",
    "— Анамнез —",
    `Роды: ${v(fields.parity)}; ПР 16–30 нед.: ${v(fields.pretermBirths16to30)}`,
    `Вес: ${v(fields.maternalWeightKg)} кг; Рост: ${v(fields.maternalHeightCm)} см`,
    `Курение: ${v(fields.smoking)}; СД: ${v(fields.diabetes)}; Хр. АГ: ${v(fields.chronicHypertension)}`,
    `СКВ: ${v(fields.sle)}; АФС: ${v(fields.aps)}; Зачатие: ${v(fields.conception)}`,
    `ПДМ: ${v(fields.lmpDate)}; ПДР по ПДМ: ${v(fields.eddByLmp)}`,
    "",
    "— УЗИ I триместра —",
    `ЧСС: ${v(fields.fhrBpm)} уд/мин`,
    `КТР: ${v(fields.crlMm)} мм; ТВП: ${v(fields.ntMm)} мм`,
    `БПР: ${v(fields.bpdMm)} мм; ОГ: ${v(fields.hcMm)} мм`,
    `DV PI: ${v(fields.dvPi)}; Кость носа: ${v(fields.nasalBone)}`,
    `Хорион: ${v(fields.chorionLocation)}; ОВ: ${v(fields.amnioticFluid)}`,
    `Пуповина: ${v(fields.cordVessels)}; прикрепление: ${v(fields.cordInsertion)}`,
    `ПДР по УЗИ: ${v(fields.eddByUs)}`,
    "",
    "— Анатомия —",
    anatomyLine("Головка/мозг", fields.anatomyHead),
    anatomyLine("Позвоночник", fields.anatomySpine),
    anatomyLine("Сердце", fields.anatomyHeart),
    anatomyLine("Живот", fields.anatomyAbdomen),
    anatomyLine("Желудок", fields.anatomyStomach),
    anatomyLine("МП / почки", fields.anatomyBladderKidneys),
    anatomyLine("Руки", fields.anatomyArms),
    anatomyLine("Ноги", fields.anatomyLegs),
    "",
    "— Биохимия / UtA / шейка (если есть) —",
    `free β-ХГЧ: ${v(fields.freeBhcgIu)} МЕ · ${v(fields.freeBhcgMom)} MoM`,
    `PAPP-A: ${v(fields.pappaIu)} МЕ · ${v(fields.pappaMom)} MoM`,
    `UtA PI mean: ${v(fields.uterinePiMean)} · ${v(fields.uterinePiMom)} MoM`,
    `САД: ${v(fields.mapMmHg)} мм рт.ст. · ${v(fields.mapMom)} MoM`,
    `Длина ЦК: ${v(fields.cervicalLengthMm)} мм`,
    "",
    "— Заключение —",
    v(fields.conclusion, "___"),
    "",
    "— Рекомендации —",
    v(fields.recommendations, "___"),
    "",
    CDS_DISCLAIMER_RU,
  ];
  return lines.join("\n");
}

export function renderT2ProtocolText(fields: GuidedT2Fields, gaLabel?: string): string {
  const lines: string[] = [
    "ПРОТОКОЛ · II/III скрининг / морфология (SonoGyn Guided)",
    `Срок: ${gaLabel ?? `${v(fields.gaWeeks)} нед. + ${v(fields.gaDays)} дн.`}`,
    "",
    "— Шапка —",
    `Дата: ${v(fields.examDate)} · ЛПУ: ${v(fields.facility)}`,
    `УЗ-сканер: ${v(fields.scanner)} · Датчик: ${v(fields.probe)} · Визуализация: ${v(fields.visualization)}`,
    `ПДР по УЗИ: ${v(fields.eddByUs)}; ПДР: ${v(fields.eddByLmp)}`,
    "",
    "— Положение / ЧСС —",
    `Положение: ${v(fields.fetalLie)}; ЧСС: ${v(fields.fhrBpm)}; Движения: ${v(fields.fetalMovements)}`,
    "",
    "— Фетометрия —",
    `БПР ${v(fields.bpdMm)} · ЛЗР ${v(fields.ofdMm)} · ОГ ${v(fields.hcMm)} · ОЖ ${v(fields.acMm)} мм`,
    `Бедро ${v(fields.flMm)} · Плечо ${v(fields.hlMm)} мм`,
    `Мозжечок ${v(fields.cerebellumMm)} · БЦ ${v(fields.cisternaMagnaMm)} · Задний рог ${v(fields.posteriorHornMm)} мм`,
    `ПМП ${v(fields.efwGrams)} г · перцентиль ${v(fields.efwPercentile)}`,
    "",
    "— Анатомия —",
    anatomyLine("Голова", fields.anatomyHead),
    anatomyLine("Мозг", fields.anatomyBrain),
    anatomyLine("Лицо", fields.anatomyFace),
    anatomyLine("Шея", fields.anatomyNeck),
    anatomyLine("Грудная клетка", fields.anatomyChest),
    anatomyLine("Сердце", fields.anatomyHeart),
    anatomyLine("Передняя брюшная стенка", fields.anatomyAbdominalWall),
    anatomyLine("ЖКТ", fields.anatomyGi),
    anatomyLine("МВС", fields.anatomyGu),
    anatomyLine("Конечности", fields.anatomyLimbs),
    "",
    "— Трубчатые кости L/R —",
    `Плечо L/R: ${v(fields.humerusLMm)} / ${v(fields.humerusRMm)} мм`,
    `Бедро L/R: ${v(fields.femurLMm)} / ${v(fields.femurRMm)} мм`,
    `Локтевая L/R: ${v(fields.ulnaLMm)} / ${v(fields.ulnaRMm)} мм`,
    `Б/берцовая L/R: ${v(fields.tibiaLMm)} / ${v(fields.tibiaRMm)} мм`,
    "",
    "— Плацента / ОВ / пуповина —",
    `Плацента: ${v(fields.placentaLocation)}; толщина ${v(fields.placentaThicknessMm)} мм`,
    `ОВ: ${v(fields.amnioticFluid)}; карман ${v(fields.mvpCm)} см; ИАЖ ${v(fields.afiCm)} см`,
    `Пуповина: ${v(fields.cordVessels)}`,
    "",
    "— Допплер —",
    `UtA PI L/R/mean: ${v(fields.uterinePiLeft)} / ${v(fields.uterinePiRight)} / ${v(fields.uterinePiMean)}`,
    `АП PI: ${v(fields.uaPi)}`,
    "",
    "— Шейка / мать —",
    `Длина ЦК: ${v(fields.cervicalLengthMm)} мм; зев: ${v(fields.internalOsShape)}`,
    `Матка/яичники: ${v(fields.maternalUterusOvaries)}`,
    "",
    "— Заключение —",
    v(fields.conclusion, "___"),
    "",
    "— Рекомендации —",
    v(fields.recommendations, "___"),
    "",
    CDS_DISCLAIMER_RU,
  ];
  return lines.join("\n");
}

export function renderProtocolText(
  fields: GuidedT1Fields | GuidedT2Fields,
  catalogWindowId: GuidedWindowId,
  gaLabel?: string,
): string {
  if (isT1Window(catalogWindowId)) {
    return renderT1ProtocolText(fields as GuidedT1Fields, gaLabel);
  }
  return renderT2ProtocolText(fields as GuidedT2Fields, gaLabel);
}
