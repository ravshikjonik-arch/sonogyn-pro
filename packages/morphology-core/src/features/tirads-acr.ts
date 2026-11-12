import type { ClassificationContextId, MorphologyFeatureDefinition, SourceReference } from "../types";
import { DEFINITION_VERSION_V1 as V, v } from "./helpers";

const ACR: SourceReference = {
  label: "ACR TI-RADS lexicon (Tessler et al., J Am Coll Radiol 2017)",
  year: 2017,
};

/**
 * ACR TI-RADS lexicon only. RU TI-RADS (`@repo/thyroid-tirads`) has different
 * categories and scoring — it must get its own definitions/adapter, not reuse these silently.
 */
const ACR_ONLY: ClassificationContextId[] = ["tirads_acr"];

export const TIRADS_ACR_FEATURES: MorphologyFeatureDefinition[] = [
  {
    featureId: "thyroid.acr_composition",
    displayName: "Состав узла (ACR)",
    anatomy: "thyroid",
    valueType: "enum",
    allowedValues: [
      v("cystic", "Кистозный / почти кистозный"),
      v("spongiform", "Губчатый"),
      v("mixed", "Смешанный кистозно-солидный"),
      v("solid", "Солидный / почти солидный"),
      v("no_nodule", "Узел не определяется"),
    ],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.acr_echogenicity",
    displayName: "Эхогенность узла (ACR)",
    anatomy: "thyroid",
    valueType: "enum",
    allowedValues: [
      v("anechoic", "Анэхогенный"),
      v("hyperechoic_or_isoechoic", "Гипер- или изоэхогенный"),
      v("hypoechoic", "Гипоэхогенный"),
      v("very_hypoechoic", "Выраженно гипоэхогенный"),
    ],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.acr_shape",
    displayName: "Форма узла (ACR)",
    anatomy: "thyroid",
    valueType: "enum",
    allowedValues: [v("wider_than_tall", "Ширина > высоты"), v("taller_than_wide", "Высота > ширины")],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.acr_margin",
    displayName: "Контур узла (ACR)",
    anatomy: "thyroid",
    valueType: "enum",
    allowedValues: [
      v("smooth", "Ровный"),
      v("ill_defined", "Нечёткий"),
      v("lobulated_or_irregular", "Дольчатый / неровный"),
      v("extrathyroidal_extension", "Экстратиреоидное распространение"),
    ],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.acr_echogenic_foci",
    displayName: "Эхогенные включения (ACR, все подходящие)",
    anatomy: "thyroid",
    valueType: "enum_set",
    allowedValues: [
      v("none_or_comet_tail", "Нет / комета"),
      v("macrocalcifications", "Макрокальцинаты"),
      v("peripheral_rim", "Периферический кальциноз"),
      v("punctate", "Точечные эхогенные фокусы"),
    ],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.nodule_largest_diameter",
    displayName: "Наибольший размер узла",
    anatomy: "thyroid",
    valueType: "quantity",
    unit: "mm",
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.gland_volume",
    displayName: "Объём щитовидной железы",
    anatomy: "thyroid",
    valueType: "quantity",
    unit: "ml",
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.parenchyma_echogenicity",
    displayName: "Эхогенность паренхимы (протокол)",
    anatomy: "thyroid",
    valueType: "text",
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.parenchyma_vascularity",
    displayName: "Васкуляризация паренхимы (протокол)",
    anatomy: "thyroid",
    valueType: "text",
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "thyroid.nodule_location",
    displayName: "Локализация узла (протокол)",
    anatomy: "thyroid",
    valueType: "text",
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
  },
  {
    featureId: "neck_lymph_nodes.assessment",
    displayName: "Лимфоузлы шеи (сводная оценка)",
    anatomy: "neck_lymph_nodes",
    valueType: "enum",
    allowedValues: [
      v("benign", "Без особенностей"),
      v("indeterminate", "Неопределённые"),
      v("suspicious", "Подозрительные"),
    ],
    applicableClassifications: ACR_ONLY,
    definitionVersion: V,
    sourceReference: ACR,
    definition: "Engine value `not_assessed` ↔ observation status `not_assessed` (не отдельный код).",
  },
];
