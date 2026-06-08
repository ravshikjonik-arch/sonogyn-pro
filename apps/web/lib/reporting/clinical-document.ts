export type ClinicalDocumentSection = {
  heading?: string;
  body: string;
};

export type ClinicalDocumentSpec = {
  /** Имя файла без расширения */
  filenameBase: string;
  title: string;
  meta?: { label: string; value: string }[];
  sections: ClinicalDocumentSection[];
  disclaimer?: string;
};

const DEFAULT_DISCLAIMER =
  "Документ сформирован в SonoGyn Pro. Не является юридически заверенной медицинской записью без подписи врача и печати учреждения. Не заменяет очное заключение специалиста.";

export function normalizeClinicalDocumentSpec(spec: ClinicalDocumentSpec): ClinicalDocumentSpec {
  return {
    ...spec,
    filenameBase: sanitizeFilename(spec.filenameBase || "document"),
    disclaimer: spec.disclaimer ?? DEFAULT_DISCLAIMER,
  };
}

export function buildClinicalDocumentHtml(spec: ClinicalDocumentSpec): string {
  const doc = normalizeClinicalDocumentSpec(spec);
  const metaBlock =
    doc.meta && doc.meta.length
      ? `<p class="meta">${doc.meta
          .map((m) => `<strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}`)
          .join("<br/>")}</p>`
      : "";

  const sections = doc.sections
    .map((s) => {
      const head = s.heading ? `<h2>${escapeHtml(s.heading)}</h2>` : "";
      return `${head}<div class="body">${textToHtmlParagraphs(s.body)}</div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ru" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8"/>
  <meta name="ProgId" content="Word.Document"/>
  <meta name="Generator" content="SonoGyn Pro"/>
  <title>${escapeHtml(doc.title)}</title>
  <style>
    body { font-family: "Segoe UI", "Noto Sans", system-ui, sans-serif; color: #0f172a; margin: 40px; line-height: 1.5; }
    .logo { font-size: 20px; font-weight: 800; color: #1d6fd8; letter-spacing: 0.04em; }
    .meta { margin-top: 16px; font-size: 13px; color: #475569; }
    h1 { font-size: 22px; margin: 20px 0 12px; }
    h2 { font-size: 15px; margin: 20px 0 8px; color: #334155; text-transform: uppercase; letter-spacing: 0.03em; }
    .body p { margin: 0 0 8px; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    @media print { body { margin: 18mm; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="logo">SonoGyn Pro</div>
  ${metaBlock}
  <h1>${escapeHtml(doc.title)}</h1>
  ${sections}
  <p class="footer">${escapeHtml(doc.disclaimer ?? DEFAULT_DISCLAIMER)}</p>
  <p class="no-print footer">Подсказка: «Печать» → «Сохранить как PDF» в диалоге принтера (Chrome / Edge).</p>
</body>
</html>`;
}

export function clinicalDocumentPlainText(spec: ClinicalDocumentSpec): string {
  const doc = normalizeClinicalDocumentSpec(spec);
  const meta =
    doc.meta?.map((m) => `${m.label}: ${m.value}`).join("\n") ?? "";
  const body = doc.sections
    .map((s) => (s.heading ? `${s.heading}\n${s.body}` : s.body))
    .join("\n\n");
  return [doc.title, meta, body, doc.disclaimer].filter(Boolean).join("\n\n");
}

function textToHtmlParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\p{L}\p{N}\-_]+/gu, "-").replace(/-+/g, "-").slice(0, 80) || "document";
}
