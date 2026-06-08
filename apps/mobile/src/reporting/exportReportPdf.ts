import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders plain text as a simple PDF and opens the system share sheet. */
export async function exportReportPdf(options: { title: string; bodyText: string }): Promise<void> {
  const body = escapeHtml(options.bodyText).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
  const title = escapeHtml(options.title);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #111; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 14pt; margin: 0 0 16px; font-weight: 700; }
    p { margin: 0; white-space: normal; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${body}</p>
</body>
</html>`;

  if (Platform.OS === "web") {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      throw new Error("Popup was blocked. Allow popups to export the report.");
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: options.title });
}
