export type UterusViewPresetId =
  | "anterior"
  | "posterior"
  | "sagittal"
  | "fundus"
  | "cervix"
  | "three_quarter";

export type UterusViewPresetConfig = {
  label: string;
  position: [number, number, number];
  target: [number, number, number];
};

export const UTERUS_CAMERA_PRESETS: Record<UterusViewPresetId, UterusViewPresetConfig> = {
  three_quarter: {
    label: "3/4",
    position: [2.1, 0.35, 2.35],
    target: [0, 0.15, 0],
  },
  anterior: {
    label: "Разрез",
    position: [0.02, 0.12, 3.35],
    target: [0, 0.12, 0],
  },
  posterior: {
    label: "Сзади",
    position: [0.05, 0.15, -3.1],
    target: [0, 0.05, 0],
  },
  sagittal: {
    label: "Сагитталь",
    position: [3.2, 0.1, 0.05],
    target: [0, 0.05, 0],
  },
  fundus: {
    label: "Дно",
    position: [0.1, 3.0, 0.4],
    target: [0, 0.2, 0],
  },
  cervix: {
    label: "Шейка",
    position: [0.1, -2.6, 0.5],
    target: [0, -0.5, 0],
  },
};
