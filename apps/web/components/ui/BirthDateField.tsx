"use client";

import {
  ageFromBirthDateIso,
  birthDatePickerBounds,
  formatAgeYearsRu,
  formatBirthDateRu,
  validateBirthDateIso,
  birthDateErrorMessage,
} from "@repo/types";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  /** Show «Дата рождения» label */
  showLabel?: boolean;
  disabled?: boolean;
};

const { minIso, maxIso } = birthDatePickerBounds();

export function BirthDateField({
  value,
  onChange,
  id = "birth-date",
  required = false,
  className = "",
  labelClassName = "text-sm font-medium text-slate-700 dark:text-slate-200",
  showLabel = true,
  disabled = false,
}: Props) {
  const validationError = value ? validateBirthDateIso(value) : null;
  const age = value && !validationError ? ageFromBirthDateIso(value) : null;
  const displayRu = value && !validationError ? formatBirthDateRu(value) : null;

  return (
    <div className="block">
      {showLabel ? (
        <label htmlFor={id} className={labelClassName}>
          Дата рождения
        </label>
      ) : null}
      <input
        id={id}
        type="date"
        className={className}
        value={value}
        min={minIso}
        max={maxIso}
        required={required}
        disabled={disabled}
        autoComplete="bday"
        aria-label="Дата рождения"
        aria-invalid={validationError ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {displayRu && age !== null ? (
        <div className="mt-1.5 space-y-0.5 text-sm font-medium text-[var(--clinical-primary-deep)]">
          <p>Дата рождения: {displayRu}</p>
          <p>Возраст: {formatAgeYearsRu(age)}</p>
        </div>
      ) : validationError ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {birthDateErrorMessage(validationError)}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Выберите дату в календаре — возраст посчитается автоматически.</p>
      )}
    </div>
  );
}

/** Read-only DOB + age for profile header. */
export function BirthDateDisplay({ iso, birthYear }: { iso?: string | null; birthYear?: number | null }) {
  const age = iso ? ageFromBirthDateIso(iso) : null;
  const display = iso ? formatBirthDateRu(iso) : null;

  if (!display && !birthYear) return null;

  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
        Дата рождения
      </p>
      {display ? (
        <>
          <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
            Дата рождения: {display}
          </p>
          {age !== null ? (
            <p className="mt-1 text-sm font-medium text-[var(--clinical-primary-deep)]">
              Возраст: {formatAgeYearsRu(age)}
            </p>
          ) : null}
        </>
      ) : birthYear ? (
        <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
          Год {birthYear}
          <span className="mt-1 block text-sm font-normal text-slate-500">Уточните полную дату в настройках ниже</span>
        </p>
      ) : null}
    </div>
  );
}
