import type { EuSourceRef } from "./types";

export const EU_TIRADS_ENGINE_VERSION = "eu-tirads-2017_eta-2023_ru-kr-2024-v1";

export const EU_SOURCES = {
  EU_TIRADS_2017: {
    id: "EU_TIRADS_2017",
    citation:
      "Russ G. et al. European Thyroid Association Guidelines for Ultrasound Malignancy Risk Stratification of Thyroid Nodules in Adults: The EU-TIRADS. Eur Thyroid J. 2017;6:225–237.",
    version: "2017",
  },
  ETA_2023: {
    id: "ETA_2023",
    citation:
      "Durante C., Hegedüs L. et al. 2023 European Thyroid Association Clinical Practice Guidelines for thyroid nodule management. Eur Thyroid J. 2023;12(5):e230067.",
    version: "2023",
  },
  RU_KR_2024: {
    id: "RU_KR_2024",
    citation:
      "Клинические рекомендации «Заболевания и состояния, связанные с дефицитом йода». Российская ассоциация эндокринологов, 2024 (ID 620_3).",
    version: "2024",
  },
} as const satisfies Record<EuSourceRef["id"], EuSourceRef>;
