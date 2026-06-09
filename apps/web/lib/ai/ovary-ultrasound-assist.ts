import {
  countMarkersByKind,
  type OvaryMarkerKind,
  type OvaryMorphologyPreset,
  type OvaryTopographyMarker,
} from "@repo/clinical-3d/organs/ovary";

export type OvaryImageMetrics = {
  width: number;
  height: number;
  /** Доля тёмных пикселей (анэхогенные зоны) 0–1 */
  darkRatio: number;
  /** Оценка «кольца» периферических зон */
  peripheralRingScore: number;
};

export type OvaryAiAssistInput = {
  morphology: OvaryMorphologyPreset;
  markers: OvaryTopographyMarker[];
  menopausalStatus?: "premenopause" | "perimenopause" | "postmenopause" | "unknown";
  cycleDay?: number;
  ovaryVolumeMl?: number;
  afcCount?: number;
  userNotes?: string;
  imageMetrics?: OvaryImageMetrics;
  mediaType?: "image" | "video_frame" | "none";
};

export type OvaryAiPattern =
  | "normal_ovary"
  | "multifollicular"
  | "polycystic_pattern"
  | "dominant_follicle"
  | "functional_cyst_likely"
  | "hemorrhagic_cyst_likely"
  | "dermoid_suspect"
  | "endometrioma_likely"
  | "indeterminate";

export type OvaryAiAssistResult = {
  pattern: OvaryAiPattern;
  patternLabelRu: string;
  oradsHint: string;
  confidence: "low" | "medium";
  summaryRu: string;
  checklistRu: string[];
  disclaimerRu: string;
  suggestedMarkerKinds: OvaryMarkerKind[];
};

const DISCLAIMER =
  "ИИ-подсказка для обучения и структурирования описания. Не является диагнозом. Решение и O-RADS — за лечащим врачом по ACR O-RADS US и клинике.";

export function analyzeOvaryUltrasoundAssist(input: OvaryAiAssistInput): OvaryAiAssistResult {
  const { markers, morphology } = input;
  const right = countMarkersByKind(markers, "right");
  const left = countMarkersByKind(markers, "left");
  const totalFollicles = right.follicles + left.follicles;
  const afc = input.afcCount ?? totalFollicles;

  const hasHemorrhagic = markers.some((m) => m.kind === "cyst_hemorrhagic");
  const hasDermoid = markers.some((m) => m.kind === "cyst_dermoid");
  const hasEndometrioma = markers.some((m) => m.kind === "cyst_endometrioma");
  const hasFunctional = markers.some((m) => m.kind === "cyst_functional");
  const hasDominant = markers.some((m) => m.kind === "dominant_follicle");

  let pattern: OvaryAiPattern = "indeterminate";
  const checklist: string[] = [];

  if (hasDermoid) {
    pattern = "dermoid_suspect";
    checklist.push("Оценить солидные/жировые компоненты, «дерево», отсутствие акустической тени — по O-RADS.");
  } else if (hasEndometrioma) {
    pattern = "endometrioma_likely";
    checklist.push("Типичная однородная «шоколадная» киста — O-RADS 2–3 по картине.");
  } else if (hasHemorrhagic) {
    pattern = "hemorrhagic_cyst_likely";
    checklist.push("Сетчатое содержимое, ретракция сгустка — типичная геморрагическая киста (O-RADS 2).");
  } else if (hasFunctional) {
    pattern = "functional_cyst_likely";
    checklist.push("Простая анэхогенная киста с тонкой стенкой — функциональная/физиологическая до 5 см в пременопаузе.");
  } else if (hasDominant) {
    pattern = "dominant_follicle";
    checklist.push("Доминантный фолликул — указать размер, стенку, отсутствие септ/солидного компонента.");
  } else if (
    morphology === "polycystic_pattern" ||
    morphology === "multifollicular" ||
    afc >= 12 ||
    (input.imageMetrics && input.imageMetrics.peripheralRingScore > 0.55 && input.imageMetrics.darkRatio > 0.12)
  ) {
    pattern = afc >= 20 || morphology === "polycystic_pattern" ? "polycystic_pattern" : "multifollicular";
    checklist.push(
      "Периферически расположенные фолликулы 2–9 мм, строма часто гиперэхогенная.",
      "Для СПКЯ — сопоставить с клиникой, АМГ, андрогенами; для мультифолликулярного рисунка — контекст стимуляции/цикла.",
    );
  } else if (totalFollicles >= 6 || morphology === "enlarged") {
    pattern = "multifollicular";
    checklist.push("Увеличенный яичник с множественными фолликулами — описать число, размер, распределение.");
  } else if (morphology === "normal" && totalFollicles <= 5 && (input.ovaryVolumeMl == null || input.ovaryVolumeMl <= 12)) {
    pattern = "normal_ovary";
    checklist.push("Размеры и фолликулы в пределах физиологии для возраста/фазы цикла.");
  }

  const patternLabels: Record<OvaryAiPattern, string> = {
    normal_ovary: "Ближе к нормальному яичнику",
    multifollicular: "Мультифолликулярный рисунок",
    polycystic_pattern: "Рисунок поликистоза (≥12 фолликулов 2–9 мм)",
    dominant_follicle: "Доминантный фолликул",
    functional_cyst_likely: "Вероятна функциональная киста",
    hemorrhagic_cyst_likely: "Вероятна геморрагическая киста",
    dermoid_suspect: "Подозрение на дермоид",
    endometrioma_likely: "Вероятна эндометриома",
    indeterminate: "Требуется уточнение по снимку и клинике",
  };

  const oradsMap: Record<OvaryAiPattern, string> = {
    normal_ovary: "Ориентир O-RADS 1",
    multifollicular: "Часто O-RADS 1 (физиология) — при солидных/сложных признаках выше",
    polycystic_pattern: "Часто O-RADS 1; при отдельных кистах — по типу образования",
    dominant_follicle: "O-RADS 1 (физиологический фолликул до 3 см)",
    functional_cyst_likely: "O-RADS 2 (типичная простая киста)",
    hemorrhagic_cyst_likely: "O-RADS 2 (типичная геморрагическая)",
    dermoid_suspect: "O-RADS 2–4/5 по признакам — уточнить в калькуляторе",
    endometrioma_likely: "O-RADS 2–3",
    indeterminate: "Пройти O-RADS Pro в калькуляторе",
  };

  const notes = input.userNotes?.trim() ? ` Комментарий врача: ${input.userNotes.trim().slice(0, 200)}` : "";

  return {
    pattern,
    patternLabelRu: patternLabels[pattern],
    oradsHint: oradsMap[pattern],
    confidence: input.imageMetrics || markers.length > 0 ? "medium" : "low",
    summaryRu: `${patternLabels[pattern]}. ${oradsMap[pattern]}. На макете: фолликулов/очагов ${markers.length}, AFC≈${afc}.${notes}`,
    checklistRu: checklist.length ? checklist : ["Загрузите снимок или отметьте фолликулы на схеме.", "Заполните O-RADS Pro для итоговой категории."],
    disclaimerRu: DISCLAIMER,
    suggestedMarkerKinds:
      pattern === "multifollicular" || pattern === "polycystic_pattern"
        ? ["follicle", "follicle", "follicle"]
        : pattern === "hemorrhagic_cyst_likely"
          ? ["cyst_hemorrhagic"]
          : pattern === "functional_cyst_likely"
            ? ["cyst_functional"]
            : pattern === "dermoid_suspect"
              ? ["cyst_dermoid"]
              : ["follicle"],
  };
}

/** Простая оценка кадра УЗИ (яркость/периферия) — только для подсказки, не диагностика. */
export async function extractOvaryImageMetrics(file: File): Promise<OvaryImageMetrics | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const maxSide = 320;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let dark = 0;
    let peripheral = 0;
    let peripheralDark = 0;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.45;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const isDark = lum < 85;
        if (isDark) dark++;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist > r * 0.55 && dist < r) {
          peripheral++;
          if (isDark) peripheralDark++;
        }
      }
    }
    const total = w * h;
    return {
      width: w,
      height: h,
      darkRatio: dark / total,
      peripheralRingScore: peripheral > 0 ? peripheralDark / peripheral : 0,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractVideoFrameMetrics(file: File): Promise<OvaryImageMetrics | null> {
  if (!file.type.startsWith("video/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    await new Promise<void>((res, rej) => {
      video.onloadeddata = () => res();
      video.onerror = rej;
    });
    video.currentTime = Math.min(1, (video.duration || 2) * 0.35);
    await new Promise<void>((res) => {
      video.onseeked = () => res();
    });
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 240;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return null;
    return extractOvaryImageMetrics(new File([blob], "frame.jpg", { type: "image/jpeg" }));
  } finally {
    URL.revokeObjectURL(url);
  }
}
