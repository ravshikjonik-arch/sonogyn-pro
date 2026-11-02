/** Known OCR / original-print anomalies — do not silently "fix" in engine. */
export const MEDVEDEV_BOOK_WARNINGS = [
  {
    id: "thymus_2_27_25_26",
    tableId: "2.27",
    messageRu:
      "Тимус 25–26 нед: в оригинале для диаметра p50 < p5 — значение оставлено как в книге.",
  },
  {
    id: "appendix_2_week_37_sdj",
    tableId: "appendix_2",
    messageRu: "Казахстан, 37 нед: СДЖ p5=85 выглядит аномально (оцифровка/оригинал).",
  },
  {
    id: "appendix_4_fl_p95_eq_p50",
    tableId: "appendix_4",
    messageRu: "Узбекистан, 29 и 31 нед: ДБК p95 = p50 в источнике.",
  },
  {
    id: "doppler_3_6_column",
    tableId: "3.6",
    messageRu:
      "ПССК 3.6: вторая колонка в книге с дублированным заголовком; в данных — лёгочный ствол.",
  },
] as const;

export const MEDVEDEV_BOOK_DISCLAIMER =
  "Справочная оценка по нормативным таблицам фетометрии. Не является диагнозом. Интерпретацию выполняет лечащий специалист.";

export const MEDVEDEV_BOOK_SOURCE_VERSION = "2026-11-01-fetometry-tables";
