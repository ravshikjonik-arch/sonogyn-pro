/** Public web path prefix for referat echograms (served from apps/web/public). */
export const ORADS_REFERAT_PUBLIC_IMAGE_BASE = "/clinical-atlas/orads-referat";

/**
 * Wizard `imageRef` → referat echogram (author's clinical cases / ACR screenshots).
 * Preferred over adnex-education atlas when a direct teaching match exists.
 */
export const ORADS_REFERAT_IMAGE_BY_REF: Record<string, string> = {
  "atlas/localization": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/acr-guidance-rads.png`,
  "atlas/ovarian": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-04.png`,
  "atlas/extraovarian": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-01.png`,
  "atlas/extraovarian/paraovarian": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-01.png`,
  "atlas/extraovarian/hydrosalpinx": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-02.png`,
  "atlas/extraovarian/peritoneal_inclusion": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-01.png`,
  "atlas/physiologic": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-04.png`,
  "atlas/simple_cyst": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-05.png`,
  "atlas/solid_dominant": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-09.png`,
  "atlas/classic_benign": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-05.png`,
  "atlas/irregular_wall": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-06.png`,
  "atlas/papillary_4plus": `${ORADS_REFERAT_PUBLIC_IMAGE_BASE}/case-10.png`,
};

/** Optional didactic caption keyed by imageRef (RU; UI may translate). */
export const ORADS_REFERAT_CAPTION_BY_REF: Record<string, string> = {
  "atlas/extraovarian/paraovarian": "Клинический случай 1 — параовариальная киста",
  "atlas/extraovarian/hydrosalpinx": "Клинический случай 2 — гидросальпинкс",
  "atlas/simple_cyst": "Клинический случай 5 — simple vs non-simple",
  "atlas/irregular_wall": "Клинический случай 6 — типы внутренней стенки",
  "atlas/papillary_4plus": "Клинический случай 10 — папиллярные разрастания",
};

export function getReferatImagePath(imageRef: string): string | undefined {
  return ORADS_REFERAT_IMAGE_BY_REF[imageRef];
}

export function getReferatCaseIdForImageRef(imageRef: string): string | undefined {
  const path = ORADS_REFERAT_IMAGE_BY_REF[imageRef];
  if (!path) return undefined;
  const match = path.match(/case-(\d+)\.png$/);
  return match ? `case-${match[1]}` : undefined;
}
