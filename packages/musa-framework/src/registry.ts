import type { MusaFrameworkModule } from "./types/musa";

/** Sonogyn MUSA Framework — roadmap of uterine/gynecologic ultrasound education modules. */
export const MUSA_FRAMEWORK_MODULES: MusaFrameworkModule[] = [
  {
    id: "adenomyosis",
    titleRu: "MUSA · Аденомиоз",
    titleEn: "MUSA · Adenomyosis",
    standard: "MUSA",
    status: "ready",
    route: "/musa/adenomyosis",
    descriptionRu: "Прямые и косвенные признаки, JZ, локализация, Sonogyn Score, протокол.",
  },
  {
    id: "fibroids",
    titleRu: "Миомы · FIGO",
    titleEn: "Uterine Fibroids · FIGO",
    standard: "FIGO PALM-COEIN / leiomyoma map",
    status: "ready",
    route: "/uterus-3d",
    descriptionRu: "FIGO subclassification, 3D-карта, протокол миомы.",
  },
  {
    id: "endometrium",
    titleRu: "Эндометрий · IETA",
    titleEn: "Endometrium · IETA",
    standard: "IETA",
    status: "planned",
    descriptionRu: "Эндометрий–миометриальный комплекс, vascular score, жидкость.",
  },
  {
    id: "orads_us",
    titleRu: "O-RADS US",
    titleEn: "O-RADS Ultrasound",
    standard: "ACR O-RADS US",
    status: "ready",
    route: "/calculators/o-rads",
    descriptionRu: "Риск злокачественности придатков по O-RADS US.",
  },
  {
    id: "orads_mri",
    titleRu: "O-RADS MRI",
    titleEn: "O-RADS MRI",
    standard: "ACR O-RADS MRI",
    status: "planned",
    descriptionRu: "МР-стratification придатков (планируется).",
  },
  {
    id: "idea_endometriosis",
    titleRu: "IDEA · Глубокий эндометриоз",
    titleEn: "IDEA · Deep Endometriosis",
    standard: "IDEA / Enzian (educational)",
    status: "ready",
    route: "/idea-deep-endometriosis",
    descriptionRu: "Structured reporting глубокого эндометриоза.",
  },
  {
    id: "musa_myometrium",
    titleRu: "MUSA · Миометрий",
    titleEn: "MUSA · Myometrium",
    standard: "MUSA myometrium descriptors",
    status: "planned",
    descriptionRu: "Расширенная таксономия миометрия (планируется).",
  },
  {
    id: "esge",
    titleRu: "ESGE · Эндометриоз",
    titleEn: "ESGE Endometriosis",
    standard: "ESGE",
    status: "planned",
    descriptionRu: "Классификация и хирургическое картирование (планируется).",
  },
];

export function getReadyMusaModules(): MusaFrameworkModule[] {
  return MUSA_FRAMEWORK_MODULES.filter((m) => m.status === "ready" && m.route);
}
