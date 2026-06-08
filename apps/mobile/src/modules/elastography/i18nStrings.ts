import type { AppLanguage } from "../../i18n";

type Dict = Record<string, string>;

const ru: Dict = {
  elasto_title: "Эластография",
  elasto_subtitle: "Strain и Shear Wave · интерпретация",
  elasto_step_organ: "Шаг 1 · Орган",
  elasto_step_method: "Шаг 2 · Метод",
  elasto_step_input: "Шаг 3 · Показатели",
  elasto_step_result: "Результат",
  elasto_organ_cervix: "Шейка матки",
  elasto_organ_myometrium: "Миометрий",
  elasto_organ_ovary: "Яичники",
  elasto_organ_breast: "Молочные железы",
  elasto_organ_liver: "Печень",
  elasto_organ_liver_soon: "Скоро",
  elasto_organ_cervix_sub: "Strain · CCI · риск ПР",
  elasto_organ_myometrium_sub: "SWE · миома / аденомиоз",
  elasto_organ_ovary_sub: "Strain + SWE · IOTA",
  elasto_organ_breast_sub: "Tsukuba · BI-RADS",
  elasto_method_strain: "Strain",
  elasto_method_strain_desc: "Компрессионная эластография, относительная жёсткость",
  elasto_method_swe: "Shear Wave",
  elasto_method_swe_desc: "Сдвиговая волна · кПa / м/с",
  elasto_method_both: "Strain + SWE",
  elasto_method_both_desc: "Комбинированная оценка",
  elasto_calculate: "Рассчитать",
  elasto_save_history: "Сохранить в историю",
  elasto_share_pdf: "Поделиться PDF",
  elasto_reference: "Cut-off справочник",
  elasto_patient_id: "ID пациента",
  elasto_patient_name: "ФИО (опционально)",
  elasto_disclaimer:
    "Результат носит справочный характер и не заменяет заключение врача. Окончательное решение принимает специалист.",
  elasto_risk_low: "Низкий риск",
  elasto_risk_intermediate: "Промежуточно",
  elasto_risk_high: "Повышенный риск",
  elasto_field_cervix_internal: "Индекс жёсткости внутреннего зева",
  elasto_field_cervix_external: "Индекс жёсткости наружного зева",
  elasto_hint_cervix_internal: "Норма 0.0–1.0 · strain map",
  elasto_hint_cervix_external: "Норма 0.05–1.0 · референс наружного зева",
  elasto_field_gestational_weeks: "Срок беременности",
  elasto_hint_gestational_weeks: "Недели · опционально",
  elasto_field_lesion_kpa: "E образования",
  elasto_field_ref_myometrium_kpa: "E неизменённого миометрия",
  elasto_hint_lesion_kpa: "кПa · SWE ROI",
  elasto_hint_ref_myometrium_kpa: "кПa · соседний миометрий",
  elasto_field_strain_ratio: "Strain ratio",
  elasto_hint_strain_ratio_ovary: "Образование / строма · <3 доброкач.",
  elasto_field_young_kpa: "Модуль Юнга (SWE)",
  elasto_hint_young_kpa_ovary: "кПa · при SWE",
  elasto_field_tsukuba: "Шкала Tsukuba (1–5)",
  elasto_hint_tsukuba: "1–2 мягкое · 4–5 жёсткое",
  elasto_field_strain_ratio_fat: "Strain ratio (жир/образование)",
  elasto_hint_strain_ratio_breast: "<3 доброкач. · >5 подозрительно",
  elasto_field_emax: "Emax (SWE)",
  elasto_hint_emax: "кПa · максимум в ROI",
  elasto_field_lesion_size: "Размер образования",
  elasto_field_lesion_depth: "Глубина",
  elasto_hint_lesion_size: "мм",
  elasto_hint_lesion_depth: "мм от кожи",
  elasto_lesion_type: "Тип образования",
  elasto_type_fibroid: "Миома",
  elasto_type_adenomyosis: "Аденомиоз",
  elasto_type_unclear: "Неясно",
  elasto_iota_cyst: "Киста",
  elasto_iota_endometrioma: "Кистома/эндометриома",
  elasto_iota_solid: "Солидное",
  elasto_val_required: "Обязательное поле",
  elasto_val_number: "Введите число",
  elasto_val_range: "Значение вне допустимого диапазона",
  elasto_warn_kpa_calibration: "Выше типичной калибровки прибора — проверьте ROI",
  elasto_warn_strain_calibration: "Strain ratio очень высок — артефакт?",
  elasto_warn_cci_range: "Индекс вне типичного диапазона CCI",
  elasto_history_saved: "Сохранено в локальную историю",
  elasto_history_error: "Не удалось сохранить",
  elasto_pdf_error: "Ошибка PDF",
  elasto_myometrium_type_label: "Тип образования (миометрий)",
  elasto_ovary_type_label: "Тип по IOTA",
};

const en: Dict = {
  ...ru,
  elasto_title: "Elastography",
  elasto_subtitle: "Strain & Shear Wave interpretation",
  elasto_disclaimer: "For reference only; final decision by the clinician.",
  elasto_calculate: "Calculate",
  elasto_save_history: "Save to history",
  elasto_share_pdf: "Share PDF",
};

const es: Dict = {
  ...ru,
  elasto_title: "Elastografía",
  elasto_subtitle: "Strain y Shear Wave",
  elasto_disclaimer: "Solo referencia; decisión final del médico.",
  elasto_calculate: "Calcular",
  elasto_save_history: "Guardar en historial",
  elasto_share_pdf: "Compartir PDF",
};

const bundles: Record<AppLanguage, Dict> = {
  ru,
  en,
  es,
  fr: en,
  it: en,
  ar: en,
};

export function elastoT(key: string, locale: AppLanguage = "ru"): string {
  return bundles[locale][key] ?? bundles.ru[key] ?? key;
}

export function attachElastographyI18n(i18nInstance: { translations: Record<string, Dict> }) {
  for (const lang of Object.keys(bundles) as AppLanguage[]) {
    i18nInstance.translations[lang] = { ...i18nInstance.translations[lang], ...bundles[lang] };
  }
}
