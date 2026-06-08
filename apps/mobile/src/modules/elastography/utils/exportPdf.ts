/**
 * Генерация PDF-отчёта по результатам эластографии.
 * Использует expo-print для создания HTML → PDF и expo-sharing для отправки.
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import type { ElastographyHistoryEntry } from "../types";
import { getConfig } from "../remoteConfig/configLoader";
import { RISK_COLORS } from "../remoteConfig/defaultConfig";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function riskColorToHex(category: string): string {
  switch (category) {
    case "low":
      return RISK_COLORS.low;
    case "intermediate":
      return RISK_COLORS.intermediate;
    case "high":
      return RISK_COLORS.high;
    default:
      return "#757575";
  }
}

function riskLabel(category: string): string {
  switch (category) {
    case "low":
      return "Низкий риск";
    case "intermediate":
      return "Промежуточный риск";
    case "high":
      return "Высокий риск";
    default:
      return "Не определён";
  }
}

function organLabel(organ: string): string {
  const map: Record<string, string> = {
    cervix: "Шейка матки",
    myometrium: "Миометрий",
    ovary: "Яичники",
    breast: "Молочная железа",
  };
  return map[organ] || organ;
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    strain: "Компрессионная эластография (Strain)",
    shear_wave: "Эластография сдвиговой волны (SWE)",
    both: "Комбинированная оценка",
  };
  return map[method] || method;
}

async function buildHtml(entry: ElastographyHistoryEntry): Promise<string> {
  const config = await getConfig();
  const meta = config.meta;
  const hex = riskColorToHex(entry.result.riskCategory);
  const riskText = riskLabel(entry.result.riskCategory);
  const date = new Date(entry.createdAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Заключение эластографии — SonoGyn Pro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; padding: 32px; max-width: 700px; margin: 0 auto; }
    .header { border-bottom: 3px solid #005CB9; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 700; color: #005CB9; }
    .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    .patient-info { background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .patient-info p { margin: 4px 0; font-size: 14px; }
    .result-card { border: 2px solid ${hex}; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .risk-badge { display: inline-block; background: ${hex}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 12px; }
    .value { font-size: 28px; font-weight: 700; color: ${hex}; margin: 8px 0; }
    .conclusion { font-size: 15px; margin: 12px 0; line-height: 1.5; }
    .recommendation { background: #fff8e1; border-left: 4px solid #FB8C00; padding: 12px 16px; border-radius: 4px; margin-top: 16px; font-size: 14px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table th, .details-table td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
    .details-table th { background: #f5f7fa; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; }
    .disclaimer { background: #fce4ec; padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 11px; color: #c62828; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SonoGyn Pro</div>
    <div class="subtitle">Модуль эластографии | Справочник v${escapeHtml(meta.version)} (${escapeHtml(meta.source)})</div>
  </div>

  <h1>Заключение эластографии</h1>

  <div class="patient-info">
    <p><strong>Пациент:</strong> ${escapeHtml(entry.patientName || "Не указан")}</p>
    <p><strong>Дата исследования:</strong> ${escapeHtml(date)}</p>
    <p><strong>Орган:</strong> ${escapeHtml(organLabel(entry.organ))}</p>
    <p><strong>Метод:</strong> ${escapeHtml(methodLabel(entry.method))}</p>
  </div>

  <div class="result-card">
    <span class="risk-badge">${escapeHtml(riskText)}</span>
    <div class="value">${escapeHtml(String(entry.result.value))}</div>
    <div class="conclusion">${escapeHtml(entry.result.conclusion)}</div>
    <div class="recommendation">
      <strong>Рекомендация:</strong> ${escapeHtml(entry.result.recommendation)}
    </div>
  </div>

  ${
    entry.result.details && Object.keys(entry.result.details).length > 0
      ? `
  <table class="details-table">
    <tr><th>Параметр</th><th>Значение</th></tr>
    ${Object.entries(entry.result.details)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
      .join("")}
  </table>`
      : ""
  }

  <div class="disclaimer">
    ⚠️ Данный отчёт сформирован автоматически и носит справочный характер. Окончательное клиническое решение принимает врач на основании полного объёма диагностической информации.
  </div>

  <div class="footer">
    <p>SonoGyn Pro v${escapeHtml(meta.minAppVersion ?? "0.2.0")} | Сгенерировано: ${escapeHtml(new Date().toISOString())}</p>
    <p>Клинические источники: ${escapeHtml(meta.source)}</p>
  </div>
</body>
</html>`;
}

/** Сгенерировать PDF и открыть диалог «Поделиться». */
export async function exportElastographyPdf(entry: ElastographyHistoryEntry): Promise<boolean> {
  try {
    const html = await buildHtml(entry);

    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
      base64: false,
    });

    let canShare = false;
    try {
      canShare = await Sharing.isAvailableAsync();
    } catch {
      console.warn("[Elastography PDF] expo-sharing недоступен на этой платформе");
    }

    if (!canShare) {
      Alert.alert(
        "Экспорт PDF",
        `PDF-файл создан, но отправка недоступна на этом устройстве.\nПуть: ${uri}`,
      );
      return true;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Экспорт заключения эластографии",
      UTI: "com.adobe.pdf",
    });

    return true;
  } catch (error) {
    console.error("[Elastography PDF] Ошибка экспорта:", error);
    Alert.alert("Ошибка экспорта", "Не удалось создать PDF-файл. Попробуйте ещё раз.");
    return false;
  }
}

/** Только сгенерировать PDF (без диалога «Поделиться»). */
export async function generatePdfSilently(entry: ElastographyHistoryEntry): Promise<string | null> {
  try {
    const html = await buildHtml(entry);
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
      base64: false,
    });
    return uri;
  } catch (error) {
    console.error("[Elastography PDF] Ошибка тихой генерации:", error);
    return null;
  }
}
