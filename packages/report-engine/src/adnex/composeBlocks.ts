import type { AdnexTriangulation } from "@repo/adnex-education";
import type { AdnexStructuredReportInput } from "@repo/types";

import type { RuCatalog } from "../i18n/ru";
import { maxMeasurementMm } from "./mapInput";

export function composeAdnexDescription(
  input: AdnexStructuredReportInput,
  tri: AdnexTriangulation,
  t: RuCatalog,
): string {
  const m = input.morphology;
  const lines: string[] = [];

  lines.push(`УЗ-придатки:`);

  if (m.localization) {
    lines.push(`Локализация: ${t.adnex.localization[m.localization]}.`);
  }
  if (m.menopause) {
    lines.push(`Менопаузальный статус: ${t.adnex.menopause[m.menopause]}.`);
  }
  if (m.lesionKind) {
    lines.push(`Характер: ${t.adnex.lesionKind[m.lesionKind]}.`);
  }
  if (m.structure) {
    lines.push(`Структура: ${t.adnex.structure[m.structure]}.`);
  }
  if (m.septaThickness) {
    lines.push(`Перегородки: ${t.adnex.septa[m.septaThickness]}.`);
  }
  if (m.solidComponent != null) {
    lines.push(
      m.solidComponent
        ? `Солидный компонент: ${m.largestSolidDiameterMm ?? "—"} мм${m.solidType ? ` (${t.adnex.solidType[m.solidType]})` : ""}.`
        : "Солидный компонент не выявлен.",
    );
  }
  if (m.bloodFlow) {
    lines.push(`Кровоток: ${t.adnex.bloodFlow[m.bloodFlow]}.`);
  }
  if (m.iotaColorScore) {
    lines.push(`Color score IOTA: ${m.iotaColorScore}.`);
  }
  if (m.ascites) lines.push("Асцит: отмечается.");
  if (m.peritonealNodules) lines.push("Перитонеальные импланты/узелки: отмечаются.");

  const maxMm = maxMeasurementMm(input);
  if (maxMm > 0) {
    lines.push(t.adnex.measurements(maxMm, input.measurements.volumeMl));
  }

  if (tri.suggestedOradsNote) {
    lines.push(tri.suggestedOradsNote);
  }

  if (input.freeTextFindings?.trim()) {
    lines.push(input.freeTextFindings.trim());
  }

  if (tri.pitfalls.length) {
    const pitfallLines = tri.pitfalls.map((p) => `${t.adnex.pitfall_prefix}: ${p.title} — ${p.message}`);
    lines.push(...pitfallLines);
  }

  return lines.join("\n");
}

export function composeAdnexImpression(
  input: AdnexStructuredReportInput,
  tri: AdnexTriangulation,
  t: RuCatalog,
  oradsVersion: string,
): string {
  const lines: string[] = [tri.headline];

  if (input.classification.oradsCategory == null) {
    lines.push(t.adnex.missing_orads);
  }

  lines.push(t.adnex.orads_line(tri.oradsCategory, oradsVersion));
  lines.push(
    t.adnex.iota_line(
      tri.iotaVerdict,
      tri.iotaBenign.join(", "),
      tri.iotaMalignant.join(", "),
    ),
  );
  lines.push(t.adnex.agreement[tri.agreement]);

  return lines.join("\n");
}

export function composeAdnexRecommendations(tri: AdnexTriangulation): string {
  const lines: string[] = [tri.managementRu];

  for (const p of tri.pitfalls) {
    if (p.severity === "critical" || p.severity === "warning") {
      lines.push(`${p.title}: ${p.message}`);
    }
  }

  return lines.join("\n");
}
