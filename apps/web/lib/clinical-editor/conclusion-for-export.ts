import type { UltrasoundProtocolPayload } from "@repo/types";

import { htmlToPlainText } from "./html-to-plain";
import { sanitizeClinicalHtml } from "./sanitize-clinical-html";

/** Plain conclusion for search, email, and legacy exports. */
export function resolveProtocolConclusionPlain(protocol: UltrasoundProtocolPayload): string {
  const fromHtml = protocol.conclusion_html?.trim()
    ? htmlToPlainText(protocol.conclusion_html)
    : "";
  if (fromHtml) return fromHtml;
  return protocol.conclusion?.trim() ?? "";
}

/** Sanitized HTML for PDF / Word when rich narrative exists. */
export function resolveProtocolConclusionHtml(protocol: UltrasoundProtocolPayload): string | null {
  if (protocol.conclusion_html?.trim()) {
    return sanitizeClinicalHtml(protocol.conclusion_html);
  }
  const plain = protocol.conclusion?.trim();
  if (!plain) return null;
  return sanitizeClinicalHtml(
    `<p>${plain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</p>`,
  );
}

export function appendClinicalConclusion(
  current: Pick<UltrasoundProtocolPayload, "conclusion" | "conclusion_html">,
  addition: string,
): Pick<UltrasoundProtocolPayload, "conclusion" | "conclusion_html"> {
  const trimmed = addition.trim();
  if (!trimmed) return current;

  const plain = current.conclusion?.trim() ? `${current.conclusion}\n\n${trimmed}` : trimmed;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const para = `<p>${esc(trimmed).replace(/\n/g, "<br/>")}</p>`;

  let html: string;
  if (current.conclusion_html?.trim()) {
    html = current.conclusion_html + para;
  } else if (current.conclusion?.trim()) {
    html = `<p>${esc(current.conclusion).replace(/\n/g, "<br/>")}</p>${para}`;
  } else {
    html = para;
  }

  return {
    conclusion: plain,
    conclusion_html: sanitizeClinicalHtml(html),
  };
}

export function syncProtocolConclusionFields(
  protocol: UltrasoundProtocolPayload,
): UltrasoundProtocolPayload {
  const html = protocol.conclusion_html?.trim()
    ? sanitizeClinicalHtml(protocol.conclusion_html)
    : "";
  const plainFromHtml = html ? htmlToPlainText(html) : "";
  const plain = plainFromHtml || protocol.conclusion?.trim() || "";

  return {
    ...protocol,
    conclusion: plain || undefined,
    conclusion_html: html || undefined,
  };
}
