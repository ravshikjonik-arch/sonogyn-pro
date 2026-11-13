import type { GuidedWindowId, GuidedWindowMeta } from "./types";

/** Day bounds (0-based weeks*7 + days). 11+0 = 77, 13+6 = 97, 18+0 = 126, 22+6 = 160, 28+0 = 196. */
export const GUIDED_WINDOWS: GuidedWindowMeta[] = [
  {
    id: "early",
    labelRu: "Ранний срок (до I скрининга)",
    gaLabelRu: "до 11+0",
    gaDaysMin: 0,
    gaDaysMax: 76,
    sourceNoteRu: "ISUOG early pregnancy; исключить эктопию / критерии неудачи",
  },
  {
    id: "t1_screening",
    labelRu: "I пренатальный скрининг",
    gaLabelRu: "11+0–13+6",
    gaDaysMin: 77,
    gaDaysMax: 97,
    sourceNoteRu: "ISUOG 11–13+6 + структура скрининга ДЗМ (Столичное здравоохранение)",
  },
  {
    id: "t2_anomaly",
    labelRu: "II скрининг / морфология",
    gaLabelRu: "18+0–22+6",
    gaDaysMin: 126,
    gaDaysMax: 160,
    sourceNoteRu: "ISUOG mid-trimester; ориентир ДЗМ 19–21 нед.",
  },
  {
    id: "t3_growth",
    labelRu: "III скрининговый срок · рост / допплер",
    gaLabelRu: "34+0–36+6",
    gaDaysMin: 238,
    gaDaysMax: 258,
    sourceNoteRu: "III скрининг 34–36 нед. (SonoGyn); ISUOG growth/Doppler по показаниям",
  },
];

export function gaDaysFromWeeksDays(weeks: number, days = 0): number {
  return Math.max(0, Math.floor(weeks) * 7 + Math.floor(days));
}

/** Approximate CRL→GA days (Robinson-like linear band for routing only, not dating SSOT). */
export function approximateGaDaysFromCrlMm(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 5 || crlMm > 90) return null;
  // Rough: GA days ≈ 8.052 × √CRL(mm) + 23.73 (Robinson) — routing only
  return Math.round(8.052 * Math.sqrt(crlMm) + 23.73);
}

export function formatGaLabel(gaDays: number): string {
  const w = Math.floor(gaDays / 7);
  const d = gaDays % 7;
  return `${w}+${d}`;
}

function windowContains(meta: GuidedWindowMeta, gaDays: number): boolean {
  if (gaDays < meta.gaDaysMin) return false;
  if (meta.gaDaysMax == null) return true;
  return gaDays <= meta.gaDaysMax;
}

export type ResolveWindowResult = {
  windowId: GuidedWindowId;
  meta: GuidedWindowMeta;
  gaDays: number;
  gaLabel: string;
  /** True when GA falls in a gap (e.g. 14–17+6) — nearest screening window suggested. */
  outsidePrimaryWindow: boolean;
  bannerRu: string | null;
};

function nearestWindow(gaDays: number): GuidedWindowMeta {
  let best = GUIDED_WINDOWS[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const w of GUIDED_WINDOWS) {
    const mid =
      w.gaDaysMax == null ? w.gaDaysMin + 40 : (w.gaDaysMin + w.gaDaysMax) / 2;
    const dist = Math.abs(gaDays - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = w;
    }
  }
  return best;
}

export function resolveGuidedWindow(gaDays: number): ResolveWindowResult {
  const clamped = Math.max(0, Math.floor(gaDays));
  const hit = GUIDED_WINDOWS.find((w) => windowContains(w, clamped));
  if (hit) {
    return {
      windowId: hit.id,
      meta: hit,
      gaDays: clamped,
      gaLabel: formatGaLabel(clamped),
      outsidePrimaryWindow: false,
      bannerRu: null,
    };
  }

  const nearest = nearestWindow(clamped);
  return {
    windowId: "between_windows",
    meta: {
      id: "between_windows",
      labelRu: `Вне скринингового окна · ближайшее: ${nearest.labelRu}`,
      gaLabelRu: formatGaLabel(clamped),
      gaDaysMin: clamped,
      gaDaysMax: clamped,
      sourceNoteRu: nearest.sourceNoteRu,
    },
    gaDays: clamped,
    gaLabel: formatGaLabel(clamped),
    outsidePrimaryWindow: true,
    bannerRu: `Срок ${formatGaLabel(clamped)} вне основных скрининговых окон. Показан сценарий «${nearest.labelRu}» как ориентир — сверьте с показаниями ЛПУ.`,
  };
}

/** Which step catalog to load when between windows. */
export function stepsCatalogWindowId(result: ResolveWindowResult): Exclude<GuidedWindowId, "between_windows"> {
  if (result.windowId !== "between_windows") return result.windowId;
  const nearest = nearestWindow(result.gaDays);
  return nearest.id as Exclude<GuidedWindowId, "between_windows">;
}
