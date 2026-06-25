import type { VascularProtocolChecklist } from "@/lib/ai/vascular-ultrasound/protocol-checklists";

export function formatVascularChecklistForPrint(checklist: VascularProtocolChecklist): string {
  const lines = [
    "ДУПЛЕКСНОЕ СКАНИРОВАНИЕ · Sonogyn Pro",
    `${checklist.title} (${checklist.kulikovChapter})`,
    "",
    "Показания:",
    checklist.indication,
    "",
    "Техника:",
    ...checklist.technique.map((t) => `  • ${t}`),
    "",
    "Морфология:",
    ...checklist.morphology.map((m) => `  • ${m}`),
    "",
    "Гемодинамика:",
    ...checklist.hemodynamics.map((h) => `  • ${h}`),
  ];

  if (checklist.functionalTests?.length) {
    lines.push("", "Функциональные пробы:", ...checklist.functionalTests.map((f) => `  • ${f}`));
  }

  lines.push("", "Структура заключения:", ...checklist.reportSections.map((r) => `  • ${r}`));
  lines.push("", "—", "Интерпретация — лечащим специалистом. Не является диагнозом.");

  return lines.join("\n");
}

export function printVascularChecklist(checklist: VascularProtocolChecklist): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${checklist.title}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;line-height:1.5;font-size:13px;max-width:720px}
h1{font-size:16px;margin:0 0 8px} pre{white-space:pre-wrap;font-family:inherit}
</style></head><body>
<h1>${checklist.title}</h1>
<pre>${formatVascularChecklistForPrint(checklist).replace(/</g, "&lt;")}</pre>
</body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
