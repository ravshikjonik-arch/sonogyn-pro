/**
 * Ракурсы в мировых координатах сцены (ось матки ~ Y, шейка внизу, дно сверху).
 * Модель в группе с лёгким поворотом — пресеты подобраны для «чётких» ортогональных и интракавитарных видов.
 */
export type UterusViewPresetId =
  | "free"
  | "three_quarter"
  | "anterior"
  | "posterior"
  | "patient_left"
  | "patient_right"
  | "fundus"
  | "cervix_os"
  | "intracavity_to_fundus"
  | "intracavity_to_cervix"
  | "hysteroscopy_scar"
  /** Клинические подписи к ортогональным видам */
  | "sagittal"
  | "axial"
  | "coronal";

export type UterusViewPresetConfig = {
  position: [number, number, number];
  target: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  /** Для «камеры в полости» — ближняя плоскость отсечения */
  near?: number;
  fov?: number;
};

export const DEFAULT_ORBIT_POLAR: { min: number; max: number } = {
  min: 0.35,
  max: Math.PI - 0.35,
};

export const DEFAULT_ORBIT_DISTANCE: { min: number; max: number } = {
  min: 1.85,
  max: 5.2,
};

export const UTERUS_VIEW_PRESET_MAP: Record<Exclude<UterusViewPresetId, "free">, UterusViewPresetConfig> = {
  three_quarter: {
    position: [2.35, 0.55, 2.55],
    target: [0, 0.1, 0],
  },
  /** Спереди (к лицевой стенке тела матки) */
  anterior: {
    position: [0, 0.16, 3.05],
    target: [0, 0.08, 0],
    minPolarAngle: 0.25,
    maxPolarAngle: Math.PI - 0.25,
  },
  /** Сзади */
  posterior: {
    position: [0, 0.16, -3.05],
    target: [0, 0.08, 0],
    minPolarAngle: 0.25,
    maxPolarAngle: Math.PI - 0.25,
  },
  /** Слева от пациента / сбоку */
  patient_left: {
    position: [3.05, 0.12, 0],
    target: [0, 0.08, 0],
  },
  patient_right: {
    position: [-3.05, 0.12, 0],
    target: [0, 0.08, 0],
  },
  /** Сверху к дну матки */
  fundus: {
    position: [0.12, 3.05, 0.42],
    target: [0, 0.75, 0],
    minPolarAngle: 0.12,
    maxPolarAngle: Math.PI - 0.12,
  },
  /** Снизу к области шейки */
  cervix_os: {
    position: [0.38, -2.75, 0.62],
    target: [0, -0.72, 0],
    minPolarAngle: 0.2,
    maxPolarAngle: Math.PI - 0.2,
  },
  /** Гистероскопия: вверх к дну, узкий объектив */
  intracavity_to_fundus: {
    position: [0.012, 0.26, 0.068],
    target: [0, 1.18, 0],
    minDistance: 0.028,
    maxDistance: 2.15,
    minPolarAngle: 0.015,
    maxPolarAngle: Math.PI - 0.015,
    near: 0.0028,
    fov: 49,
  },
  /** Гистероскопия: к шейке, узкий объектив */
  intracavity_to_cervix: {
    position: [-0.018, 0.055, 0.058],
    target: [0, -1.18, 0],
    minDistance: 0.028,
    maxDistance: 2.15,
    minPolarAngle: 0.015,
    maxPolarAngle: Math.PI - 0.015,
    near: 0.0028,
    fov: 49,
  },
  /** Гистероскопия: фокус на передней стенке LUS / дефект рубца */
  hysteroscopy_scar: {
    position: [0.055, 0.03, 0.092],
    target: [0.46, -0.56, 0.34],
    minDistance: 0.022,
    maxDistance: 2.35,
    minPolarAngle: 0.012,
    maxPolarAngle: Math.PI - 0.012,
    near: 0.0022,
    fov: 46,
  },
  /** Парасагиттально — совпадает с «слева от пациента» в упрощённой модели */
  sagittal: {
    position: [3.05, 0.12, 0],
    target: [0, 0.08, 0],
  },
  /** Аксиально (условно «сверху» крупного тела матки) */
  axial: {
    position: [0.12, 3.05, 0.42],
    target: [0, 0.75, 0],
    minPolarAngle: 0.12,
    maxPolarAngle: Math.PI - 0.12,
  },
  /** Фронтально / коронально к передней стенке */
  coronal: {
    position: [0, 0.16, 3.05],
    target: [0, 0.08, 0],
    minPolarAngle: 0.25,
    maxPolarAngle: Math.PI - 0.25,
  },
};

export function resolveUterusViewPreset(id: UterusViewPresetId): UterusViewPresetConfig | null {
  if (id === "free") return null;
  return UTERUS_VIEW_PRESET_MAP[id];
}

export const UTERUS_VIEW_PRESET_LABELS_RU: Record<UterusViewPresetId, string> = {
  free: "Свободно",
  three_quarter: "3/4",
  anterior: "Спереди",
  posterior: "Сзади",
  patient_left: "Слева",
  patient_right: "Справа",
  fundus: "Сверху (дно)",
  cervix_os: "Снизу (шейка)",
  intracavity_to_fundus: "Гистеро ↑ дно",
  intracavity_to_cervix: "Гистеро ↓ шейка",
  hysteroscopy_scar: "Гистеро → рубец",
  sagittal: "Сагиттально",
  axial: "Аксиально",
  coronal: "Коронально",
};
