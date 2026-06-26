export const FETAL_SPINE_IMAGE_BASE = "/education/fetal-spine";

export function fetalSpineImageSrc(imageId: number): string {
  return `${FETAL_SPINE_IMAGE_BASE}/card_${String(imageId).padStart(2, "0")}.jpeg`;
}

export const FETAL_SPINE_DISCLAIMER =
  "Образовательный материал · не является медицинским диагнозом · интерпретация — специалистом";

export const FETAL_SPINE_LINKS = {
  obstetricAtlas: { href: "/tools/refs/obstetric-atlas", label: "Атлас I триместра" },
  evidence: { href: "/evidence?shelf=us-fmf", label: "SonoEvidence · FMF" },
  library: { href: "/tools/refs", label: "Библиотека" },
} as const;
