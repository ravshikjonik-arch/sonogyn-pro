/**
 * Жёсткие физические/клинические пределы для эластографии.
 * Последняя линия защиты перед расчётом.
 */

export type HardLimit = {
  min: number;
  max: number;
  description?: string;
};

export const HARD_LIMITS = {
  kPa: {
    min: 0.5,
    max: 300,
    description: "Калибровка приборов: Siemens (0.5–70 м/с ≈ 0.8–147 кПа), Supersonic (до 300 кПа)",
  },
  stiffnessIndex: {
    min: 0.01,
    max: 1.0,
  },
  strainRatio: {
    min: 0.1,
    max: 25,
  },
  tsukubaScore: {
    min: 1,
    max: 5,
  },
  lesionSizeMm: {
    min: 1,
    max: 300,
  },
  lesionDepthMm: {
    min: 0.5,
    max: 100,
  },
  gestationalWeeks: {
    min: 14,
    max: 42,
  },
  sweRatio: {
    min: 0.1,
    max: 20,
  },
} as const satisfies Record<string, HardLimit>;

export class ElastographyInputError extends Error {
  public readonly field: string;
  public readonly value: number;
  public readonly limit: HardLimit;

  constructor(message: string, field: string, value: number, limit: HardLimit) {
    super(message);
    this.name = "ElastographyInputError";
    this.field = field;
    this.value = value;
    this.limit = limit;
  }
}

export function assertInRange(value: number, limit: HardLimit, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new ElastographyInputError(
      `Некорректное значение "${fieldName}": ${value}. Допустимый диапазон: ${limit.min} – ${limit.max}`,
      fieldName,
      value,
      limit,
    );
  }
  if (value < limit.min || value > limit.max) {
    throw new ElastographyInputError(
      `Значение "${fieldName}" = ${value} выходит за пределы калибровки прибора (${limit.min} – ${limit.max}${limit.description ? ` | ${limit.description}` : ""})`,
      fieldName,
      value,
      limit,
    );
  }
}

export function assertOptionalInRange(
  value: number | undefined | null,
  limit: HardLimit,
  fieldName: string,
): void {
  if (value !== undefined && value !== null) {
    assertInRange(value, limit, fieldName);
  }
}
