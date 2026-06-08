"use client";

import {
  buildClinicalDocumentHtml,
  clinicalDocumentPlainText,
  type ClinicalDocumentSpec,
} from "./clinical-document";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printClinicalDocument(spec: ClinicalDocumentSpec): boolean {
  const html = buildClinicalDocumentHtml(spec);
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 450);
  return true;
}

export function downloadClinicalWord(spec: ClinicalDocumentSpec) {
  const html = buildClinicalDocumentHtml(spec);
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  downloadBlob(blob, `${spec.filenameBase}.doc`);
}

export async function downloadClinicalPdf(spec: ClinicalDocumentSpec): Promise<void> {
  const [{ pdf }, { ClinicalTextPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/reporting/clinical-text-pdf-document"),
  ]);
  const blob = await pdf(<ClinicalTextPdfDocument spec={spec} />).toBlob();
  downloadBlob(blob, `${spec.filenameBase}.pdf`);
}

export function openClinicalEmail(spec: ClinicalDocumentSpec) {
  const subject = encodeURIComponent(spec.title);
  const plain = clinicalDocumentPlainText(spec);
  const body = encodeURIComponent(
    `Добрый день,\n\n${plain.slice(0, 3500)}${plain.length > 3500 ? "\n\n[…текст обрезан для mailto; полная версия — в PDF/Word]" : ""}\n\nС уважением,`,
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export async function shareClinicalDocument(spec: ClinicalDocumentSpec): Promise<"shared" | "email" | "unsupported"> {
  try {
    const [{ pdf }, { ClinicalTextPdfDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/reporting/clinical-text-pdf-document"),
    ]);
    const blob = await pdf(<ClinicalTextPdfDocument spec={spec} />).toBlob();
    const file = new File([blob], `${spec.filenameBase}.pdf`, { type: "application/pdf" });
    const plain = clinicalDocumentPlainText(spec).slice(0, 8000);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: spec.title,
          text: plain,
          files: [file],
        });
        return "shared";
      } catch {
        /* user cancelled or unsupported files */
      }
    }
    openClinicalEmail(spec);
    return "email";
  } catch {
    openClinicalEmail(spec);
    return "email";
  }
}
