"use client";

import { DOCTOR_SPECIALIZATION_OPTIONS } from "@repo/clinical-tools";

import { authInputClass } from "@/components/auth/AuthScreenShell";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locale";
import { parseBirthDateInput, birthDateErrorMessage } from "@/lib/auth/birth-date";
import {
  buildFioAbbreviation,
  normalizeRussianFio,
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";
import { maskRuDateInput } from "@/lib/utils/ru-date";

type DoctorRegistrationFieldsProps = {
  fullName: string;
  onFullNameChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  specialization: string;
  onSpecializationChange: (value: string) => void;
  locale: AppLocale;
  onLocaleChange: (value: AppLocale) => void;
};

export function DoctorRegistrationFields({
  fullName,
  onFullNameChange,
  birthDate,
  onBirthDateChange,
  specialization,
  onSpecializationChange,
  locale,
  onLocaleChange,
}: DoctorRegistrationFieldsProps) {
  function onBirthInput(raw: string) {
    onBirthDateChange(maskRuDateInput(raw));
  }

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
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Дата рождения</span>
        <input
          className={`${authInputClass} font-mono tracking-wide`}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          value={birthDate}
          onChange={(e) => onBirthInput(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            onBirthInput(e.clipboardData.getData("text"));
          }}
          placeholder="21.12.1988"
          required
          aria-label="Дата рождения"
        />
        <p className="mt-1 text-xs text-slate-500">Формат ДД.ММ.ГГГГ</p>
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

/** @deprecated используйте validateDoctorBirthDate */
export function validateDoctorBirthYear(value: string): number | null {
  return validateDoctorBirthDate(value)?.year ?? null;
}

export function validateDoctorBirthDate(value: string): ReturnType<typeof parseBirthDateInput> {
  return parseBirthDateInput(value);
}

export { birthDateErrorMessage };
