import type { CpiCaseInput, CpiEvaluationResult } from "../domain/schemas";

export type CpiReportFormat = "html" | "pdf" | "docx";

/** Part 8 — unified report generator. */
export function generateCpiReport(
  format: CpiReportFormat,
  input: CpiCaseInput,
  evaluation: CpiEvaluationResult,
): { mimeType: string; filename: string; body: string | Buffer } {
  switch (format) {
    case "html":
      return {
        mimeType: "text/html; charset=utf-8",
        filename: "cpi-report.html",
        body: generateCpiHtmlReport(input, evaluation),
      };
    case "pdf":
      return {
        mimeType: "application/pdf",
        filename: "cpi-report.pdf",
        body: generateCpiPdfReport(input, evaluation),
      };
    case "docx":
      return {
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "cpi-report.docx",
        body: generateCpiDocxReport(input, evaluation),
      };
  }
}

function buildPlainTextReport(input: CpiCaseInput, evaluation: CpiEvaluationResult): string {
  const lines = [
    "Cervical Pathology Intelligence — Report",
    evaluation.computedAt,
    "",
    `HPV: ${input.hpv.status} · ${input.hpv.genotypes.join(", ")}`,
    `Cytology: ${input.cytology.result.toUpperCase()}`,
    `Histology: ${input.histology.result}`,
    evaluation.swedeTotal !== null ? `Swede Score: ${evaluation.swedeTotal}/10` : "",
    "",
    "Risk Assessment:",
    `  CIN1: ${(evaluation.risk.cin1Risk * 100).toFixed(1)}%`,
    `  CIN2+: ${(evaluation.risk.cin2PlusRisk * 100).toFixed(1)}%`,
    `  CIN3+: ${(evaluation.risk.cin3PlusRisk * 100).toFixed(1)}%`,
    `  AIS: ${(evaluation.risk.aisRisk * 100).toFixed(1)}%`,
    `  Invasion: ${(evaluation.risk.invasionRisk * 100).toFixed(1)}%`,
    "",
    "IFCPC Protocol:",
    evaluation.ifcpcProtocolText,
    "",
    "Recommendations:",
    ...evaluation.actions.map((a) => `- ${a.labelRu}: ${a.rationale}`),
    "",
    evaluation.explanation,
    "",
    evaluation.disclaimer,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Minimal PDF 1.4 (Helvetica text) — no external deps. */
export function generateCpiPdfReport(input: CpiCaseInput, evaluation: CpiEvaluationResult): Buffer {
  const text = buildPlainTextReport(input, evaluation);
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines = escaped.split("\n");
  const contentLines = ["BT", "/F1 10 Tf", "50 750 Td", "14 TL"];
  for (let i = 0; i < lines.length; i++) {
    const prefix = i === 0 ? "" : "T* ";
    contentLines.push(`${prefix}(${lines[i]}) Tj`);
  }
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const streamLen = Buffer.byteLength(stream, "utf8");

  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${streamLen} >>stream\n${stream}\nendstream\nendobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj + "\n";
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

/** Minimal OOXML DOCX (ZIP store) — Word-compatible. */
export function generateCpiDocxReport(input: CpiCaseInput, evaluation: CpiEvaluationResult): Buffer {
  const text = buildPlainTextReport(input, evaluation);
  const paragraphs = text
    .split("\n")
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr/></w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return buildZip([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rels },
    { name: "word/document.xml", data: documentXml },
  ]);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; data: string }[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const dataBuf = Buffer.from(file.data, "utf8");
    const crc = crc32(dataBuf);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBuf.length, 18);
    local.writeUInt32LE(dataBuf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    parts.push(local, dataBuf);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(dataBuf.length, 20);
    cd.writeUInt32LE(dataBuf.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    nameBuf.copy(cd, 46);
    central.push(cd);

    offset += local.length + dataBuf.length;
  }

  const centralBuf = Buffer.concat(central);
  const body = Buffer.concat([...parts, centralBuf]);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([body, end]);
}

/** Part 8 — HTML report generator (physician-ready). */
export function generateCpiHtmlReport(input: CpiCaseInput, evaluation: CpiEvaluationResult): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const actionsHtml = evaluation.actions
    .map(
      (a) =>
        `<li><strong>${esc(a.labelRu)}</strong> (${a.priority})<br/>${esc(a.rationale)}<ul>${a.references.map((r) => `<li><em>${esc(r.organization)} ${r.year}</em>: ${esc(r.citation)}</li>`).join("")}</ul></li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>CPI Report — Sonogyn Pro</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.5; }
    h1 { color: #5b21b6; }
    section { margin: 1.5rem 0; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; }
    .disclaimer { font-size: 0.75rem; color: #64748b; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>Cervical Pathology Intelligence — Report</h1>
  <p><small>${esc(evaluation.computedAt)}</small></p>

  <section><h2>HPV</h2>
    <p>Status: ${esc(input.hpv.status)} · Genotypes: ${esc(input.hpv.genotypes.join(", "))}</p>
  </section>

  <section><h2>Cytology (Bethesda)</h2>
    <p>${esc(input.cytology.result.toUpperCase())}</p>
  </section>

  <section><h2>Colposcopy / IFCPC</h2>
    <pre>${esc(evaluation.ifcpcProtocolText)}</pre>
    <p><strong>Заключение:</strong> ${esc(evaluation.ifcpcConclusion)}</p>
  </section>

  <section><h2>Swede Score</h2>
    <p>${evaluation.swedeTotal !== null ? `${evaluation.swedeTotal}/10` : "Not provided"}</p>
  </section>

  <section><h2>Histology</h2>
    <p>${esc(input.histology.result)}</p>
  </section>

  <section><h2>Risk Assessment</h2>
    <ul>
      <li>CIN1: ${(evaluation.risk.cin1Risk * 100).toFixed(1)}%</li>
      <li>CIN2+: ${(evaluation.risk.cin2PlusRisk * 100).toFixed(1)}%</li>
      <li>CIN3+: ${(evaluation.risk.cin3PlusRisk * 100).toFixed(1)}%</li>
      <li>AIS: ${(evaluation.risk.aisRisk * 100).toFixed(1)}%</li>
      <li>Invasion: ${(evaluation.risk.invasionRisk * 100).toFixed(1)}%</li>
      <li>Confidence: ${(evaluation.risk.confidenceScore * 100).toFixed(0)}%</li>
    </ul>
  </section>

  <section><h2>Clinical Recommendations</h2>
    <ol>${actionsHtml}</ol>
    <p>${esc(evaluation.explanation)}</p>
  </section>

  ${evaluation.qualityScore !== null ? `<section><h2>Quality Score</h2><p>${evaluation.qualityScore}/100 — ${esc(evaluation.qualityInterpretation ?? "")}</p></section>` : ""}

  <p class="disclaimer">${esc(evaluation.disclaimer)}</p>
</body>
</html>`;
}
