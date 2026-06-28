/**
 * PDF-экспорт POP-Q: лист для пациентки и клинический протокол.
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export type PopqPdfMode = "patient" | "clinical";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
}

function buildHtml(input: {
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  body: string;
  footer: string;
  accent: string;
}): string {
  const metaRows = input.meta
    .map(
      (m) =>
        `<tr><td class="meta-label">${escapeHtml(m.label)}</td><td class="meta-value">${escapeHtml(m.value)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(input.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; font-size: 11pt; line-height: 1.55; }
    .header { border-bottom: 3px solid ${input.accent}; padding-bottom: 12px; margin-bottom: 18px; }
    h1 { font-size: 16pt; margin: 0 0 4px; font-weight: 800; color: #0f172a; }
    .subtitle { font-size: 10pt; color: #64748b; margin: 0; }
    table.meta { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    .meta-label { width: 38%; padding: 6px 8px 6px 0; color: #64748b; font-size: 10pt; vertical-align: top; }
    .meta-value { padding: 6px 0; font-weight: 700; color: #0f172a; }
    .section-title { font-size: 11pt; font-weight: 800; color: ${input.accent}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    .body { white-space: normal; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; line-height: 1.45; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(input.title)}</h1>
    <p class="subtitle">${escapeHtml(input.subtitle)}</p>
  </div>
  <table class="meta">${metaRows}</table>
  <p class="section-title">Результат осмотра</p>
  <p class="body">${bodyToHtml(input.body)}</p>
  <p class="footer">${escapeHtml(input.footer)}</p>
</body>
</html>`;
}

export async function exportPopqPdf(options: {
  mode: PopqPdfMode;
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  bodyText: string;
  footer: string;
}): Promise<boolean> {
  const accent = options.mode === "patient" ? "#be123c" : "#1d4ed8";
  const html = buildHtml({
    title: options.title,
    subtitle: options.subtitle,
    meta: options.meta,
    body: options.bodyText,
    footer: options.footer,
    accent,
  });

  try {
    if (Platform.OS === "web") {
      const win = window.open("", "_blank", "noopener,noreferrer");
      if (!win) {
        Alert.alert("Экспорт PDF", "Разрешите всплывающие окна для печати.");
        return false;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
      return true;
    }

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Экспорт PDF", `PDF создан, но отправка недоступна.\n${uri}`);
      return false;
    }
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: options.title,
      UTI: "com.adobe.pdf",
    });
    return true;
  } catch (error) {
    console.error("[POP-Q PDF]", error);
    return false;
  }
}
