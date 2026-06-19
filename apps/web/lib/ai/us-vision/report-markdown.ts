import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";

/** Клиентский fallback, если worker не вернул reportMarkdown. */
export function buildUsVisionReportMarkdown(result: UsVisionAnalysisResult): string {
  if (result.reportMarkdown?.trim()) return result.reportMarkdown;

  const lines = [
    "# Черновик ИИ-разбора УЗИ — SonoGyn Pro",
    "",
    `**Pipeline:** ${result.pipeline}`,
    `**Модели:** ${(result.cvModels ?? []).join(", ") || "—"} · ${result.modelVersion}`,
    "",
    `> ${result.disclaimer}`,
    "",
  ];

  if (result.clinicalContext) {
    lines.push("## Клинический контекст", "", result.clinicalContext, "");
  }

  lines.push("## Сводка", "", result.studySummary, "", "## Впечатление", "", result.impression, "");

  if (result.recommendations.length) {
    lines.push("## Рекомендации", "");
    for (const r of result.recommendations) lines.push(`- ${r}`);
    lines.push("");
  }

  if (result.frames.length) {
    lines.push("## По кадрам", "");
    result.frames.forEach((f, i) => {
      lines.push(`### Кадр ${i + 1}`, "");
      if (f.sononet) {
        lines.push(
          `- **SonoNet:** ${f.sononet.labelRu} (${Math.round(f.sononet.confidence * 100)}%)`,
        );
      }
      lines.push(`- **Плоскость:** ${f.planeGuess ?? "—"}`);
      if (f.findings.length) lines.push(`- **Находки:** ${f.findings.join("; ")}`);
      if (f.scanErrors.length) lines.push(`- **Сканирование:** ${f.scanErrors.join("; ")}`);
      lines.push("");
    });
  }

  return `${lines.join("\n").trim()}\n`;
}

export function downloadUsVisionReport(result: UsVisionAnalysisResult, caseId: string): void {
  const md = buildUsVisionReportMarkdown(result);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sonogyn-us-report-${caseId.slice(0, 8)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
