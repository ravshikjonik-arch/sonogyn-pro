import { z } from "zod";

export const RegionCodeSchema = z.enum([
  "RU-MOW", // Москва
  "RU-MOS", // Московская область
  "RU-SPE", // Санкт-Петербург
  "RU-OTHER",
]);
export type RegionCode = z.infer<typeof RegionCodeSchema>;

export type RegionProfile = {
  code: RegionCode;
  labelRu: string;
  /** true when regional document cards are populated for algorithms */
  libraryConfigured: boolean;
  noteRu: string;
};

export const REGION_PROFILES: RegionProfile[] = [
  {
    code: "RU-MOW",
    labelRu: "Москва",
    libraryConfigured: true,
    noteRu: "Регион по умолчанию. Кандидаты ДЗМ помечены статусом проверки — не выдавать как подтверждённые без сверки.",
  },
  {
    code: "RU-MOS",
    labelRu: "Московская область",
    libraryConfigured: false,
    noteRu: "Региональная база не заполнена. Не смешивать с Москвой (RU-MOW).",
  },
  {
    code: "RU-SPE",
    labelRu: "Санкт-Петербург",
    libraryConfigured: false,
    noteRu: "Региональная база не заполнена.",
  },
  {
    code: "RU-OTHER",
    labelRu: "Другой субъект РФ",
    libraryConfigured: false,
    noteRu: "Укажите субъект и загрузите региональные акты отдельно.",
  },
];

export const DEFAULT_REGION: RegionCode = "RU-MOW";

export function getRegionProfile(code: RegionCode): RegionProfile {
  return REGION_PROFILES.find((r) => r.code === code) ?? REGION_PROFILES[0]!;
}
