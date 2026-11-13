/**
 * Copyright B+: book scans / PDF / journal atlases hidden from end users.
 * Calculators + official guidelines / КР remain available.
 */

/** Static assets under public/ that must not be served. */
export const COPYRIGHT_LOCKED_ASSET_PREFIXES = [
  "/clinical-atlas",
  "/clinical/orads-book",
  "/clinical/orads-nosology",
  "/clinical/cervix-atlas",
  "/clinical/endometrium-atlas",
  "/clinical/medvedev-archive",
  "/clinical/photocards",
  "/education/atlas",
  "/education/myoma",
  "/books",
] as const;

/** App routes that expose book OCR / page galleries / courses from books. */
export const COPYRIGHT_LOCKED_ROUTE_PREFIXES = [
  "/tools/refs/hofer-basic-course",
  "/tools/refs/tirads-basic-course",
  "/tools/refs/obstetric-atlas",
  "/tools/refs/obstetrics-imaging-atlas",
  "/tools/refs/prenatal-echography-atlas",
  "/tools/refs/clinical-echocardiography-atlas",
  "/tools/refs/gynecology-imaging-atlas",
  "/tools/refs/cervix-morphology-atlas",
  "/tools/refs/mammology-national-atlas",
  "/tools/refs/ovarian-tumor-morphology-atlas",
  "/tools/refs/myoma-education",
  "/tools/refs/book-nosology",
  "/tools/refs/medical-knowledge",
  "/library/obstetric-atlas",
  "/library/obstetrics-imaging-atlas",
  "/library/prenatal-echography-atlas",
  "/library/clinical-echocardiography-atlas",
  "/library/gynecology-imaging-atlas",
  "/library/cervix-morphology-atlas",
  "/library/mammology-national-atlas",
  "/library/ovarian-tumor-morphology-atlas",
] as const;

/** Official / product destinations still allowed under /tools/refs. */
export const COPYRIGHT_ALLOWED_REF_PREFIXES = [
  "/tools/refs/guidelines",
  "/tools/refs/consensus",
  "/tools/refs/norms",
  "/tools/refs/nosologies",
  "/tools/refs/evidence",
  "/tools/refs/sources",
  "/tools/refs/basic-course",
  "/tools/refs/exam-checklists",
  "/tools/refs/ambulatory-intake",
  "/tools/refs/exam-set-pieces",
  "/tools/refs/learning-paths",
  "/tools/refs/fetal-doppler-first-trimester",
  "/tools/refs/fetal-spine",
  "/tools/refs/cervix-pathology",
  "/tools/refs/webinars",
] as const;

export const COPYRIGHT_SAFE_LANDING = "/tools/refs/sources";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isCopyrightLockedAsset(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.toLowerCase().endsWith(".pdf")) return true;
  return COPYRIGHT_LOCKED_ASSET_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function isCopyrightLockedRoute(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (COPYRIGHT_ALLOWED_REF_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return false;
  }
  return COPYRIGHT_LOCKED_ROUTE_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

/** Catalog / hub cards: drop deep links into locked book surfaces. */
export function isCopyrightLockedHref(href: string): boolean {
  try {
    const path = href.startsWith("http") ? new URL(href).pathname : href.split("?")[0] ?? href;
    return isCopyrightLockedRoute(path) || isCopyrightLockedAsset(path);
  } catch {
    return false;
  }
}
