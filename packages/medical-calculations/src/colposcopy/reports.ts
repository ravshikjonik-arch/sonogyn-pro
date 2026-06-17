import {
  ANAMNESIS_LABELS,
  CERVIX_SHAPE_LABELS,
  COMPLAINT_LABELS,
  FINDING_LABELS,
  SWEDE_CRITERIA,
} from "./constants";
import { swedeRiskEmoji, swedeScoreOneLiner } from "./swede";
import type { ColposcopyProtocolInput, SwedeScoreInput, SwedeScoreResult } from "./types";

function formatDate(d = new Date()): string {
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

function anamnesisText(protocol: ColposcopyProtocolInput): string {
  const items = protocol.anamnesis.map((k) => ANAMNESIS_LABELS[k]);
  const extra = [
    protocol.ageFirstSex ? `первый половой контакт: ${protocol.ageFirstSex} лет` : "",
    protocol.births ? `роды: ${protocol.births}` : "",
    protocol.abortions ? `аборты: ${protocol.abortions}` : "",
    protocol.lmp ? `ДМ: ${protocol.lmp}` : "",
    protocol.smokes
      ? `курение${protocol.cigarettesPerDay ? ` (${protocol.cigarettesPerDay} сиг/сут)` : ""}`
      : "",
    protocol.anamnesisNotes.trim(),
  ].filter(Boolean);
  const all = [...items, ...extra];
  return all.length ? all.join("; ") : "не отмечено";
}

function complaintsText(protocol: ColposcopyProtocolInput): string {
  const items = protocol.complaints.map((c) => COMPLAINT_LABELS[c]);
  if (protocol.complaintsOther.trim()) items.push(protocol.complaintsOther.trim());
  return items.length ? items.join("; ") : "не предъявляет";
}

function findingsText(protocol: ColposcopyProtocolInput): string {
  return protocol.findings.length
    ? protocol.findings.map((f) => FINDING_LABELS[f]).join("; ")
    : "без особенностей по отмеченным признакам";
}

function swedeBreakdownText(input: SwedeScoreInput): string {
  return SWEDE_CRITERIA.map((c) => {
    const val = input[c.key];
    const opt = c.options.find((o) => o.value === val);
    return `  ${c.title}: ${opt?.label ?? val} (${val} б.)`;
  }).join("\n");
}

export function buildColposcopyProtocolText(input: {
  protocol: ColposcopyProtocolInput;
  swede: SwedeScoreInput;
  result: SwedeScoreResult;
  examinedAt?: Date;
}): string {
  const { protocol, swede, result } = input;
  const shape = protocol.cervixShape ? CERVIX_SHAPE_LABELS[protocol.cervixShape] : "—";

  const acetowhiteDetail =
    protocol.acetowhiteEpithelium === "none"
      ? "нет"
      : protocol.acetowhiteEpithelium === "delicate"
        ? "нежный"
        : "плотный";
  const marginsDetail = protocol.marginQuality === "sharp" ? "чёткие" : "нечёткие";
  const iodineDetail =
    protocol.iodineZone === "positive"
      ? "положительное окрашивание"
      : protocol.iodineZone === "partial"
        ? "частичное"
        : "йод-негативная зона";

  return [
    "ПРОТОКОЛ КОЛЬПОСКОПИИ",
    `Дата: ${formatDate(input.examinedAt)}`,
    "",
    `Пациентка: ${protocol.patientName || "—"}, ${protocol.patientAge || "—"} лет.`,
    protocol.patientId ? `ID: ${protocol.patientId}.` : "",
    "",
    `Жалобы: ${complaintsText(protocol)}.`,
    `Анамнез: ${anamnesisText(protocol)}.`,
    `Форма шейки матки: ${shape}.`,
    "",
    "КОЛЬПОСКОПИЧЕСКОЕ ОПИСАНИЕ:",
    findingsText(protocol),
    `Ацетобелый эпителий (бланк): ${acetowhiteDetail}.`,
    `Границы аномального эпителия: ${marginsDetail}.`,
    `Йод-негативная зона (бланк): ${iodineDetail}.`,
    "",
    "SWEDE SCORE (IFCPC 2011):",
    swedeBreakdownText(swede),
    `Сумма: ${result.total} / 10 баллов.`,
    `${swedeRiskEmoji(result.riskLevel)} ${result.riskLabel}`,
    result.recommendation,
    "",
    `Кольпоскопический диагноз: ${protocol.colposcopicDiagnosis || "—"}.`,
    `Клинический диагноз: ${protocol.clinicalDiagnosis || "—"}.`,
    protocol.recommendations ? `Рекомендации: ${protocol.recommendations}` : "",
    "",
    protocol.physicianName ? `Врач: ${protocol.physicianName}.` : "",
    protocol.institution ? `Учреждение: ${protocol.institution}.` : "",
    "",
    "Данные носят вспомогательный характер. Интерпретация и тактика — за лечащим специалистом.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildColposcopyPatientText(input: {
  protocol: ColposcopyProtocolInput;
  result: SwedeScoreResult;
}): string {
  const { protocol, result } = input;
  return [
    "Результаты кольпоскопического осмотра",
    "",
    `Пациентка: ${protocol.patientName || "—"}.`,
    "",
    `По шкале Swede Score: ${result.total} баллов из 10.`,
    `${result.riskLabel}.`,
    "",
    result.recommendation,
    "",
    "Интерпретация и план лечения определяются вашим лечащим врачом.",
    "Данный лист не является самостоятельным медицинским заключением.",
  ].join("\n");
}

export type TemplateVars = Record<string, string>;

export function buildTemplateVars(input: {
  protocol: ColposcopyProtocolInput;
  swede: SwedeScoreInput;
  result: SwedeScoreResult;
  examinedAt?: Date;
}): TemplateVars {
  const { protocol, result } = input;
  const shape = protocol.cervixShape ? CERVIX_SHAPE_LABELS[protocol.cervixShape] : "—";
  return {
    name: protocol.patientName || "Пациентка",
    age: protocol.patientAge || "—",
    patient_id: protocol.patientId || "—",
    date: formatDate(input.examinedAt),
    score: String(result.total),
    risk: result.riskLabel,
    recommendation: result.recommendation,
    colposcopic_diagnosis: protocol.colposcopicDiagnosis || "—",
    clinical_diagnosis: protocol.clinicalDiagnosis || "—",
    recommendations: protocol.recommendations || "—",
    complaints: complaintsText(protocol),
    anamnesis: anamnesisText(protocol),
    findings: findingsText(protocol),
    cervix_shape: shape,
    acetowhite_detail:
      protocol.acetowhiteEpithelium === "none"
        ? "нет"
        : protocol.acetowhiteEpithelium === "delicate"
          ? "нежный"
          : "плотный",
    margins_detail: protocol.marginQuality === "sharp" ? "чёткие" : "нечёткие",
    iodine_detail:
      protocol.iodineZone === "positive"
        ? "положительное"
        : protocol.iodineZone === "partial"
          ? "частичное"
          : "йод-негативная зона",
    physician: protocol.physicianName || "—",
    institution: protocol.institution || "—",
    protocol_line: swedeScoreOneLiner(result),
  };
}

export function applyColposcopyTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}
