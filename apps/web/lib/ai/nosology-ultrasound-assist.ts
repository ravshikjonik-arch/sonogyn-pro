import type { NosologyAssistContext } from "@/lib/clinical-assistant/nosology-assist-context";
import type { UltrasoundImageMetrics } from "@/lib/ai/ultrasound-image-metrics";

export type NosologyAiAssistInput = {
  context: NosologyAssistContext;
  userNotes?: string;
  voiceTranscript?: string;
  imageMetrics?: UltrasoundImageMetrics;
  mediaType?: "image" | "video_frame" | "none";
};

export type NosologyAiAssistResult = {
  patternLabelRu: string;
  summaryRu: string;
  checklistRu: string[];
  alertsRu: string[];
  ultrasoundHintsRu: string[];
  protocolSnippetRu: string;
  confidence: "low" | "medium";
  disclaimerRu: string;
};

const DISCLAIMER =
  "ИИ-подсказка для структурирования описания и чеклиста. Не является диагнозом. Решение и протокол — за лечащим врачом по клинике и гайдлайнам.";

const URGENT_KEYWORDS = [
  "кровотеч",
  "острая боль",
  "сильная боль",
  "лихорад",
  "температур",
  "шок",
  "обморок",
  "гипотон",
  "синкоп",
  "в сознании не",
];

function combinedText(input: NosologyAiAssistInput): string {
  return [input.voiceTranscript, input.userNotes].filter(Boolean).join(" ").toLowerCase();
}

function codeFamily(code?: string): string {
  if (!code) return "";
  const c = code.toUpperCase();
  if (c.startsWith("O0") || c.startsWith("Z3")) return "early_pregnancy";
  if (c.startsWith("O2") || c.startsWith("O3")) return "pregnancy";
  if (c.startsWith("N80")) return "endometriosis";
  if (c.startsWith("D25")) return "fibroid";
  if (c.startsWith("E28")) return "endocrine";
  if (c.startsWith("N83")) return "ovarian_cyst";
  if (c.startsWith("N84")) return "polyp";
  if (c.startsWith("N85")) return "endometrium";
  if (c.startsWith("N87") || c.startsWith("D06")) return "cervix";
  if (c.startsWith("N60") || c.startsWith("N61") || c.startsWith("N62") || c.startsWith("N63")) return "breast";
  if (c.startsWith("C")) return "malignancy";
  if (c === "FMF") return "fmf";
  return "general";
}

function familyChecklist(family: string, ctx: NosologyAssistContext): string[] {
  const base = ctx.ultrasoundFocus?.slice(0, 3) ?? [];
  const byFamily: Record<string, string[]> = {
    early_pregnancy: [
      "Локализация плодного яйца, размеры, эмбрион, ЧСС, желтое тело.",
      "Исключить внематочную, неразвивающуюся беременность по критериям.",
    ],
    pregnancy: [
      "Плод, плацента, воды, допплер по показаниям.",
      "Фетометрия и анатомия в окне скрининга.",
    ],
    fmf: [
      "Срезы и измерения строго по протоколу FMF для текущего окна.",
      "Red flags — в блок рекомендаций и маршрутизацию.",
    ],
    endometriosis: [
      "Эндометриомы, глубокий эндометриоз (DIE), спайки, «яйцо в коконе».",
      "Оценить связь с кишечником/мочевым пузырём при подозрении на DIE.",
    ],
    fibroid: [
      "Число, локализация FIGO, размеры, эхоструктура, васкуляризация.",
      "Субмукозные — влияние на полость; субсerosal — связь с брюшиной.",
    ],
    endocrine: [
      "Яичники: AFC, строма, фолликулы 2–9 мм; эндометрий по фазе.",
      "Для СПКЯ — сопоставить с клиникой и лабораторией.",
    ],
    ovarian_cyst: [
      "Размер, стенка, септы, солидный компонент, перфузия (O-RADS).",
      "Простая киста vs геморрагическая vs эндометриома vs дерmoid.",
    ],
    endometrium: [
      "Толщина эндометрия, однородность, полип, MIU vs гиперплазия.",
    ],
    cervix: [
      "Длина шейки (CL), funneling, плодное яйцо/цервикальная локализация.",
    ],
    breast: [
      "Эхоструктура, контуры, ориентация, задняя акустическая тень — BI-RADS.",
    ],
    malignancy: [
      "Описать все очаги, лимфоузлы, инвазию; BI-RADS / O-RADS / TI-RADS по органу.",
    ],
  };
  const extra = byFamily[family] ?? ["Орган-мишень, размеры, эхоструктура, сосудистый рисунок."];
  return [...extra, ...base].slice(0, 6);
}

function imageHints(metrics: UltrasoundImageMetrics | undefined, family: string): string[] {
  if (!metrics) return [];
  const hints: string[] = [];
  if (metrics.darkRatio > 0.22) {
    hints.push("На кадре много анэхогенных зон — опишите жидкость/кистозный компонент и стенки.");
  } else if (metrics.darkRatio < 0.06) {
    hints.push("Преимущественно гиперэхогенная картина — уточните солидный компонент и тени.");
  }
  if (metrics.peripheralRingScore > 0.52 && (family === "endocrine" || family === "ovarian_cyst" || family === "general")) {
    hints.push("Периферический «кольцевой» рисунок — при яичниках проверить мультифолликулярный/СПКЯ контекст.");
  }
  return hints;
}

function scanUrgentAlerts(text: string, ctx: NosologyAssistContext): string[] {
  const alerts: string[] = [];
  for (const kw of URGENT_KEYWORDS) {
    if (text.includes(kw)) {
      alerts.push(`Упомянуто «${kw}» — проверьте красные флаги и срочность.`);
      break;
    }
  }
  for (const flag of ctx.redFlags ?? []) {
    const tokens = flag.toLowerCase().split(/\s+/).filter((t) => t.length > 5);
    if (tokens.some((t) => text.includes(t.slice(0, Math.min(8, t.length))))) {
      alerts.push(`Совпадение с red flag: ${flag.slice(0, 120)}`);
    }
  }
  return alerts.slice(0, 4);
}

function patternLabel(family: string, ctx: NosologyAssistContext): string {
  const labels: Record<string, string> = {
    early_pregnancy: "Ранняя беременность · структура описания",
    pregnancy: "Беременность · УЗИ-фокус",
    fmf: "FMF · протокол и red flags",
    endometriosis: "Эндометриоз · УЗИ-мишени",
    fibroid: "Миома · FIGO и васкуляризация",
    endocrine: "Эндокринология / яичники",
    ovarian_cyst: "Образование яичника · O-RADS",
    endometrium: "Эндометрий / полость",
    cervix: "Шейка матки",
    breast: "Молочная железа · BI-RADS",
    malignancy: "Подозрение на злокачественность",
    general: `УЗИ · ${ctx.title}`,
  };
  return labels[family] ?? labels.general!;
}

function buildProtocolSnippet(ctx: NosologyAssistContext, checklist: string[], text: string): string {
  const code = ctx.code ? `${ctx.code}. ` : "";
  const lines = [
    `${code}${ctx.title}.`,
    ctx.group ? `Группа: ${ctx.group}.` : "",
    checklist[0] ? `УЗИ: ${checklist[0]}` : "",
    text.trim() ? `Диктовка/заметки: ${text.trim().slice(0, 280)}` : "",
    "Заключение формулирует лечащий врач.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function analyzeNosologyUltrasoundAssist(input: NosologyAiAssistInput): NosologyAiAssistResult {
  const { context: ctx } = input;
  const text = combinedText(input);
  const family = codeFamily(ctx.code);
  const checklist = familyChecklist(family, ctx);
  const ultrasoundHints = [
    ...imageHints(input.imageMetrics, family),
    ...(ctx.ultrasoundFocus?.slice(0, 2) ?? []),
  ].slice(0, 5);
  const alerts = scanUrgentAlerts(text, ctx);
  const hasMedia = Boolean(input.imageMetrics && input.mediaType !== "none");
  const hasVoice = Boolean(input.voiceTranscript?.trim());
  const confidence: "low" | "medium" = hasMedia || hasVoice || text.length > 40 ? "medium" : "low";

  const summaryParts = [patternLabel(family, ctx)];
  if (hasMedia) summaryParts.push("Кадр проанализирован для ориентировочных подсказок.");
  if (hasVoice) summaryParts.push("Учтена голосовая диктовка.");
  if (alerts.length) summaryParts.push(`Внимание: ${alerts.length} сигнал(ов).`);

  return {
    patternLabelRu: patternLabel(family, ctx),
    summaryRu: summaryParts.join(" "),
    checklistRu: checklist.length ? checklist : ["Загрузите снимок или продиктуйте находки.", "Сверьте с чеклистом приёма."],
    alertsRu: alerts,
    ultrasoundHintsRu: ultrasoundHints,
    protocolSnippetRu: buildProtocolSnippet(ctx, checklist, text || (input.userNotes ?? "")),
    confidence,
    disclaimerRu: DISCLAIMER,
  };
}
