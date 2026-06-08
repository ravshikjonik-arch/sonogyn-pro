import type { UltrasoundProtocolPayload } from "@repo/types";

export type PdfReportInput = {
  clinicName: string;
  patientLabel: string;
  studyTitle: string;
  studyDate: string;
  physicianName?: string;
  protocol: UltrasoundProtocolPayload;
};

/** Build printable HTML for browser print / PDF (jsPDF html() or window.print). */
export function buildStudyReportHtml(input: PdfReportInput): string {
  const { clinicName, patientLabel, studyTitle, studyDate, physicianName, protocol } = input;
  const b = protocol.biometry;
  const rows: [string, string][] = [
    ["КТР", fmtMm(b.crl_mm)],
    ["БПР", fmtMm(b.bpd_mm)],
    ["ОГ", fmtMm(b.hc_mm)],
    ["ОЖ", fmtMm(b.ac_mm)],
    ["ДБ", fmtMm(b.fl_mm)],
    ["ДП", fmtMm(b.hl_mm)],
    ["Масса плода (EFW)", protocol.efw_grams ? `${protocol.efw_grams} г` : "—"],
    ["Формула EFW", protocol.efw_formula ?? "—"],
    ["Срок (дни)", protocol.ga_days != null ? String(protocol.ga_days) : "—"],
  ];

  const biometryTable = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border:1px solid #ccc;font-weight:600">${k}</td><td style="padding:6px 12px;border:1px solid #ccc">${v}</td></tr>`,
    )
    .join("");

  const organs = protocol.organs ?? {};
  const organBlocks = Object.entries(organs)
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) =>
        `<h3 style="margin:16px 0 6px;font-size:14px;text-transform:uppercase;color:#334155">${organLabel(k)}</h3><p style="margin:0;line-height:1.5">${escapeHtml(String(v))}</p>`,
    )
    .join("");

  const uterusSnapshot = protocol.uterus_visualization?.snapshotDataUrl
    ? `<h2 style="font-size:15px;margin:20px 0 8px">Схема матки (3D)</h2><img src="${protocol.uterus_visualization.snapshotDataUrl}" alt="Схема матки" style="max-width:100%;max-height:320px;border:1px solid #cbd5e1;border-radius:8px"/>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Протокол УЗИ — ${escapeHtml(patientLabel)}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 40px; }
    .logo { font-size: 22px; font-weight: 800; color: #1d6fd8; letter-spacing: 0.05em; }
    .meta { margin-top: 24px; font-size: 13px; color: #475569; }
    h1 { font-size: 20px; margin: 24px 0 8px; }
    table { border-collapse: collapse; width: 100%; max-width: 480px; margin-top: 12px; font-size: 13px; }
    .conclusion { margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 8px; }
    .footer { margin-top: 48px; font-size: 11px; color: #94a3b8; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="logo">${escapeHtml(clinicName)}</div>
  <p class="meta">Пациент: <strong>${escapeHtml(patientLabel)}</strong><br/>
  Исследование: ${escapeHtml(studyTitle)}<br/>
  Дата: ${escapeHtml(studyDate)}${physicianName ? `<br/>Врач: ${escapeHtml(physicianName)}` : ""}</p>
  <h1>Протокол ультразвукового исследования</h1>
  <h2 style="font-size:15px;margin:16px 0 8px">Фетометрия</h2>
  <table>${biometryTable}</table>
  ${organBlocks}
  ${uterusSnapshot}
  ${protocol.diagnosis?.trim() ? `<div class="conclusion"><strong>Диагноз</strong><p style="margin:8px 0 0;white-space:pre-wrap">${escapeHtml(protocol.diagnosis)}</p></div>` : ""}
  <div class="conclusion">
    <strong>Заключение</strong>
    <p style="margin:8px 0 0;white-space:pre-wrap">${escapeHtml(protocol.conclusion ?? "Без заключения.")}</p>
  </div>
  <p class="footer">Документ сформирован автоматически. Не является юридически заверенной медицинской записью без подписи врача и печати учреждения.</p>
</body>
</html>`;
}

function fmtMm(v?: number): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v} мм`;
}

function organLabel(key: string): string {
  const map: Record<string, string> = {
    uterus: "Матка",
    ovaries: "Яичники",
    cervix: "Шейка матки",
    placenta: "Плацента",
    fetus: "Плод",
    bladder: "Мочевой пузырь",
  };
  return map[key] ?? key;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
