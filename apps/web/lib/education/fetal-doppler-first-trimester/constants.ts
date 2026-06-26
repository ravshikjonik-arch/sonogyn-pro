/** Doppler Ultrasound in the First Trimester (11–14 Weeks) — SonoGyn-Pro educational module. */

export const FETAL_DOPPLER_MODULE_ID = "fetal-doppler-first-trimester";

export const FETAL_DOPPLER_DISCLAIMER =
  "Образовательный материал по допплеру I триместра. Не является медицинским диагнозом; интерпретация и тактика — специалистом по протоколам FMF / ISUOG / клиники.";

export const FETAL_DOPPLER_SOURCE = {
  author: "М.В. Ситарская",
  organization: "ultrasoundoc.com",
  gestationalWindow: "11+0 – 13+6 нед",
} as const;

export const FETAL_DOPPLER_IMAGE_BASE = "/images/fetal-doppler";

export const FETAL_DOPPLER_LINKS = {
  fmf: { href: "/ai/consultants/fmf?section=first", label: "FMF · I скрининг" },
  obstetricAtlas: { href: "/tools/refs/obstetric-atlas", label: "Атлас I триместра" },
  evidence: { href: "/evidence?shelf=us-fmf", label: "SonoEvidence · FMF" },
  library: { href: "/tools/refs", label: "Библиотека" },
} as const;

/** Atlas filenames (placeholders until images uploaded). */
export const FETAL_DOPPLER_ATLAS_FILES = [
  "fetal_heart_4cv.png",
  "three_vessel_trachea.png",
  "ductus_venosus_normal.png",
  "ductus_venosus_abnormal.png",
  "umbilical_arteries.png",
  "single_umbilical_artery.png",
  "omphalocele.png",
  "gastroschisis.png",
  "uterine_artery_pi.png",
] as const;
