/**
 * Вшитая fallback-конфигурация эластографии.
 * Используется при первом запуске и когда сервер недоступен.
 * Значения согласованы с прежним constants.ts + расширены метаданными.
 */

import type { ElastographyCutoffs } from "@repo/medical-calculations/elastography";
import {
  BREAST_ELASTO,
  CERVIX_CCI,
  MYOMETRIUM_SWE,
  OVARY_ELASTO,
  RISK_COLORS,
} from "@repo/medical-calculations/elastography";
import type { ConfigResponse, ElastographyConfig } from "./types";

/** Семантическая версия вшитого справочника */
export const DEFAULT_CONFIG_VERSION = "1.0.0";

/** Полный JSON-совместимый конфиг (fallback) */
export const defaultConfig: ElastographyConfig = {
  meta: {
    version: DEFAULT_CONFIG_VERSION,
    releaseDate: "2025-01-01T00:00:00.000Z",
    minAppVersion: "0.2.0",
    checksum: "sha256:embedded-fallback-v1",
    source: "EFSUMB/WFUMB consensus, IOTA/O-RADS correlation, Tsukuba/BI-RADS adjunct",
    changelog: [
      {
        version: "1.0.0",
        date: "2025-01-01",
        changes: "Базовая вшитая конфигурация cut-off (шейка, миометрий, яичники, МЖ).",
      },
    ],
  },
  cutoffs: {
    cervix: {
      strain: {
        cci: {
          soft: {
            max: 0.5,
            label: "Мягкая шейка",
            riskLevel: "high",
            colorHex: "#E53935",
          },
          intermediate: {
            min: 0.5,
            max: 0.7,
            label: "Промежуточная",
            riskLevel: "intermediate",
            colorHex: "#FB8C00",
          },
          firm: {
            min: 0.7,
            label: "Плотная шейка",
            riskLevel: "low",
            colorHex: "#43A047",
          },
        },
        recommendations: {
          high: "Повышенный риск преждевременных родов. Рекомендована консультация акушера-гинеколога, рассмотреть цервикометрию в динамике, при сроке <34 нед — госпитализация.",
          intermediate: "Пограничные значения. Контрольная цервикометрия через 1–2 недели.",
          low: "Низкий риск. Плановое наблюдение.",
        },
      },
    },
    myometrium: {
      swe: {
        adenomyosis: { range: [20, 40], unit: "kPa" },
        fibroid: { min: 45, unit: "kPa" },
        ratioCutoff: 1.5,
        interpretations: {
          adenomyosis: "Значения в диапазоне 20–40 кПа, соотношение <1.5 характерны для аденомиоза.",
          fibroid: "Значения >45 кПа, соотношение >1.5 характерны для лейомиомы.",
          uncertain: "Пограничные значения. Рекомендована МР-диагностика.",
        },
      },
    },
    ovary: {
      strain: { ratioBenign: 3.0, ratioMalignant: 5.0 },
      swe: { emaxBenign: 30, emaxMalignant: 50, unit: "kPa" },
      integratedAssessment: {
        benign: "Низкий риск малигнизации. Соответствует O-RADS 2–3.",
        intermediate: "Неопределённый потенциал. Соответствует O-RADS 4. Рекомендована консультация онкогинеколога.",
        malignant: "Высокий риск малигнизации. Соответствует O-RADS 5. Срочная консультация онкогинеколога.",
      },
    },
    breast: {
      strain: {
        tsukubaScore: {
          "1": { label: "Однородный зелёный", risk: "benign" },
          "2": { label: "Гетерогенный зелёный", risk: "benign" },
          "3": { label: "Синий центр, зелёный ободок", risk: "intermediate" },
          "4": { label: "Синий центр, красный ободок", risk: "malignant" },
          "5": { label: "Однородный синий", risk: "malignant" },
        },
        ratioBenign: 3.0,
        ratioMalignant: 5.0,
      },
      swe: {
        emaxBenign: 80,
        emaxMalignant: 160,
        unit: "kPa",
      },
      biradsIntegration: {
        benign: "BI-RADS 2–3. Плановое наблюдение.",
        intermediate: "BI-RADS 4a–b. Рекомендована биопсия.",
        malignant: "BI-RADS 4c–5. Срочная биопсия.",
      },
    },
  },
  ui: {
    gradientColors: ["#43A047", "#FB8C00", "#E53935"],
    scaleMarkers: {
      cervix: { min: 0, max: 1, step: 0.1 },
      ovary_swe: { min: 0, max: 100, step: 5, unit: "kPa" },
      breast_swe: { min: 0, max: 200, step: 10, unit: "kPa" },
    },
  },
};

/** Экспорт для обратной совместимости (alias из ТЗ) */
export { defaultConfig as ELASTOGRAPHY_CUTOFFS };

export { BREAST_ELASTO, CERVIX_CCI, MYOMETRIUM_SWE, OVARY_ELASTO, RISK_COLORS };

/**
 * Преобразует Remote Config в cut-off для общего пакета калькуляторов.
 */
export function mapConfigToElastographyCutoffs(config: ConfigResponse): ElastographyCutoffs {
  const { cutoffs } = config;
  return {
    RISK_COLORS: {
      low: cutoffs.cervix.strain.cci.firm.colorHex,
      intermediate: cutoffs.cervix.strain.cci.intermediate.colorHex,
      high: cutoffs.cervix.strain.cci.soft.colorHex,
    },
    CERVIX_CCI: {
      soft: { max: cutoffs.cervix.strain.cci.soft.max ?? 0.5 },
      intermediate: {
        min: cutoffs.cervix.strain.cci.intermediate.min ?? 0.5,
        max: cutoffs.cervix.strain.cci.intermediate.max ?? 0.7,
      },
      firm: { min: cutoffs.cervix.strain.cci.firm.min ?? 0.7 },
    },
    MYOMETRIUM_SWE: {
      adenomyosis: {
        min: cutoffs.myometrium.swe.adenomyosis.range[0],
        max: cutoffs.myometrium.swe.adenomyosis.range[1],
        ratioMin: 1.0,
        ratioMax: 1.3,
      },
      fibroid: { min: cutoffs.myometrium.swe.fibroid.min },
      ratioCutoff: cutoffs.myometrium.swe.ratioCutoff,
    },
    OVARY_ELASTO: {
      strain: {
        benign: cutoffs.ovary.strain.ratioBenign,
        malignant: cutoffs.ovary.strain.ratioMalignant,
      },
      swe: {
        benign: cutoffs.ovary.swe.emaxBenign,
        malignant: cutoffs.ovary.swe.emaxMalignant,
      },
    },
    BREAST_ELASTO: {
      tsukuba: { benign: [1, 2], intermediate: 3, malignant: [4, 5] },
      strain: {
        benign: cutoffs.breast.strain.ratioBenign,
        malignant: cutoffs.breast.strain.ratioMalignant,
      },
      emax: {
        benign: cutoffs.breast.swe.emaxBenign,
        malignant: cutoffs.breast.swe.emaxMalignant,
      },
    },
  };
}

/** @deprecated Используйте mapConfigToElastographyCutoffs */
export const mapConfigToLegacyCutoffs = mapConfigToElastographyCutoffs;
