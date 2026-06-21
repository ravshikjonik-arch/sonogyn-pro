import { THYROID_PATTERN_LIBRARY } from "./patterns";

export const TIRADS_ATLAS_INTRO =
  "Thyroid Pattern Recognition — типичные эхографические паттерны ACR TI-RADS. PNG в /images/thyroid/ (замените на эхограммы центра; SVG — fallback).";

export type ThyroidAtlasImageMeta = {
  file: string;
  /** Базовое имя без расширения — для подмены SVG на PNG из PACS. */
  basename: string;
  titleRu: string;
  category: "normal" | "benign" | "borderline" | "malignant" | "lymph_node";
  altRu: string;
  placeholder: boolean;
  /** Предпочитаемый формат в production: положите `{basename}.png` рядом с SVG. */
  preferredExt: "png" | "svg";
};

/** Metadata for future atlas integration (PNG/SVG swap). */
export const THYROID_ATLAS_IMAGES: ThyroidAtlasImageMeta[] = [
  { file: "normal_thyroid.svg", basename: "normal_thyroid", titleRu: "Нормальная ЩЖ", category: "normal", altRu: "Схема нормальной щитовидной железы", placeholder: true, preferredExt: "png" },
  { file: "colloid_nodule.svg", basename: "colloid_nodule", titleRu: "Коллоидный узел", category: "benign", altRu: "Spongiform, comet-tail", placeholder: true, preferredExt: "png" },
  { file: "spongiform_nodule.svg", basename: "spongiform_nodule", titleRu: "Spongiform узел", category: "benign", altRu: "Губчатый узел TR2", placeholder: true, preferredExt: "png" },
  { file: "simple_cyst.svg", basename: "simple_cyst", titleRu: "Простая киста", category: "benign", altRu: "Anechoic cyst TR2", placeholder: true, preferredExt: "png" },
  { file: "hemorrhagic_cyst.svg", basename: "hemorrhagic_cyst", titleRu: "Геморрагическая киста", category: "benign", altRu: "Киста с дебрисами", placeholder: true, preferredExt: "png" },
  { file: "follicular_adenoma.svg", basename: "follicular_adenoma", titleRu: "Фолликулярная адenoma", category: "borderline", altRu: "Isoechoic halo TR3–4", placeholder: true, preferredExt: "png" },
  { file: "papillary_carcinoma.svg", basename: "papillary_carcinoma", titleRu: "Папиллярный рак", category: "malignant", altRu: "TR5 classic PTC", placeholder: true, preferredExt: "png" },
  { file: "follicular_carcinoma.svg", basename: "follicular_carcinoma", titleRu: "Фолликулярный рак", category: "malignant", altRu: "Hypoechoic solid TR4–5", placeholder: true, preferredExt: "png" },
  { file: "medullary_carcinoma.svg", basename: "medullary_carcinoma", titleRu: "Медуллярный рак", category: "malignant", altRu: "Calcifications MTC", placeholder: true, preferredExt: "png" },
  { file: "anaplastic_carcinoma.svg", basename: "anaplastic_carcinoma", titleRu: "Anaplastic рак", category: "malignant", altRu: "ETE heterogeneous mass", placeholder: true, preferredExt: "png" },
  { file: "suspicious_lymph_node.svg", basename: "suspicious_lymph_node", titleRu: "Подозрительный ЛУ", category: "lymph_node", altRu: "Loss of hilum, microcalcifications", placeholder: true, preferredExt: "png" },
];

/** URL для атласа. `preferPng` — для production после загрузки эхограмм центра. */
export function pathologyImageUrl(imageFile: string, preferPng = false): string {
  const base = imageFile.replace(/\.(svg|png|jpe?g|webp)$/i, "");
  const ext = preferPng ? "png" : imageFile.includes(".") ? imageFile.split(".").pop()! : "svg";
  return `/images/thyroid/${base}.${ext}`;
}

export function atlasImageMetaByBasename(basename: string): ThyroidAtlasImageMeta | undefined {
  return THYROID_ATLAS_IMAGES.find((m) => m.basename === basename);
}

export function atlasPatterns() {
  return THYROID_PATTERN_LIBRARY;
}
