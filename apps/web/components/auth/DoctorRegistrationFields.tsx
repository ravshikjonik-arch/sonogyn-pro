"use client";

import { DOCTOR_SPECIALIZATION_OPTIONS } from "@repo/clinical-tools";

import { authInputClass } from "@/components/auth/AuthScreenShell";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locale";
import {
  buildFioAbbreviation,
  normalizeRussianFio,
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";

type DoctorRegistrationFieldsProps = {
  fullName: string;
  onFullNameChange: (value: string) => void;
  birthYear: string;
  onBirthYearChange: (value: string) => void;
  specialization: string;
  onSpecializationChange: (value: string) => void;
  locale: AppLocale;
  onLocaleChange: (value: AppLocale) => void;
};

export function DoctorRegistrationFields({
  fullName,
  onFullNameChange,
  birthYear,
  onBirthYearChange,
  specialization,
  onSpecializationChange,
  locale,
  onLocaleChange,
}: DoctorRegistrationFieldsProps) {
  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Язык интерфейса</span>
        <select
          className={authInputClass}
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value as AppLocale)}
          aria-label="Язык интерфейса"
        >
          {APP_LOCALES.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">Базовый язык — русский. Можно сменить позже в профиле.</p>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">ФИО врача</span>
        <input
          className={authInputClass}
          type="text"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder={PRODUCT_OWNER_FIO}
          required
          autoComplete="name"
          aria-label="ФИО врача"
        />
        <p className="mt-1 text-xs text-slate-500">
          Сначала фамилия. В кабинете:{" "}
          <span className="font-semibold text-[var(--clinical-primary-deep)]">
            {fullName.trim()
              ? buildFioAbbreviation(normalizeRussianFio(fullName)) ?? "—"
              : PRODUCT_OWNER_FIO_SHORT}
          </span>
        </p>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Год рождения</span>
        <input
          className={authInputClass}
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          step={1}
          value={birthYear}
          onChange={(e) => onBirthYearChange(e.target.value)}
          placeholder="1988"
          required
          aria-label="Год рождения"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Специализация</span>
        <select
          className={authInputClass}
          value={specialization}
          onChange={(e) => onSpecializationChange(e.target.value)}
          required
          aria-label="Специализация"
        >
          <option value="">Выберите специализацию</option>
          {DOCTOR_SPECIALIZATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function validateDoctorBirthYear(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number.parseInt(trimmed, 10);
  if (year < 1900 || year > 2100) return null;
  return year;
}
