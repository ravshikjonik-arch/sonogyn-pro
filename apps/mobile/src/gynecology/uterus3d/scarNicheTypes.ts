/**
 * Образовательная модель дефекта рубца после КС / ниши (niche).
 * Размеры в мм — условное соответствие масштабу Lathe-профиля через mmToScene().
 */

export type ScarNicheMeasurementsMm = {
  /** Остаточная толщина миометрия (RMT) над дефектом, мм */
  residualMyometriumMm: number;
  /** Глубина ниши (в миометрий), мм */
  nicheDepthMm: number;
  /** Длина дефекта вдоль рубца (краниокаудально), мм */
  nicheLengthMm: number;
  /** Ширина дефекта (по окружности стенки), мм */
  nicheWidthMm: number;
  /** Расстояние от внутреннего зева до нижнего края дефекта, мм */
  distanceFromInternalOsMm: number;
};

export type ScarNicheVisualState = {
  enabled: boolean;
  measurements: ScarNicheMeasurementsMm;
};

export const DEFAULT_SCAR_NICHE_MEASUREMENTS_MM: ScarNicheMeasurementsMm = {
  residualMyometriumMm: 3.5,
  nicheDepthMm: 7,
  nicheLengthMm: 16,
  nicheWidthMm: 9,
  distanceFromInternalOsMm: 12,
};

/** Условное соответствие: ~100 мм клинической длины → ~1.15 единиц сцены по профилю тела матки. */
export function mmToScene(mm: number): number {
  return mm * (1.15 / 100);
}

/** Обратное к mmToScene — для линейных расстояний в локальных единицах Lathe-сцены */
export function sceneToApproxMm(sceneLen: number): number {
  return sceneLen * (100 / 1.15);
}

/** Образовательный индекс остаточного миометрия над нишей: RMT / (RMT + depth) */
export function nicheResidualMyometrialRatio(rmtMm: number, nicheDepthMm: number): number {
  const d = nicheDepthMm + rmtMm;
  if (d <= 1e-6) return 0;
  return Math.min(1, Math.max(0, rmtMm / d));
}

export function clampMeasurementMm(m: ScarNicheMeasurementsMm): ScarNicheMeasurementsMm {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    residualMyometriumMm: clamp(m.residualMyometriumMm, 0.8, 14),
    nicheDepthMm: clamp(m.nicheDepthMm, 2, 28),
    nicheLengthMm: clamp(m.nicheLengthMm, 5, 45),
    nicheWidthMm: clamp(m.nicheWidthMm, 4, 35),
    distanceFromInternalOsMm: clamp(m.distanceFromInternalOsMm, 0, 40),
  };
}

export function buildScarNicheProtocolText(m: ScarNicheMeasurementsMm, enabled = true): string {
  const c = clampMeasurementMm(m);
  const ratio = nicheResidualMyometrialRatio(c.residualMyometriumMm, c.nicheDepthMm);
  if (!enabled) return "Ниша после КС: не описана.";
  return [
    `Ниша после КС: RMT ${c.residualMyometriumMm.toFixed(1)} мм`,
    `глубина ${c.nicheDepthMm.toFixed(1)} мм`,
    `длина ${c.nicheLengthMm.toFixed(1)} мм`,
    `ширина ${c.nicheWidthMm.toFixed(1)} мм`,
    `от внутр. зева ${c.distanceFromInternalOsMm.toFixed(1)} мм`,
    `residual ratio ${(ratio * 100).toFixed(1)}%`,
  ].join("; ");
}

/** Уровень нижнего сегмента (латеральная проекция профиля Lathe), передняя стенка θ≈0 → +X. */
export const SCAR_BAND_CENTER_Y = -0.62;
