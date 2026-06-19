"use client";

import { maskRuPhoneInput } from "@/lib/auth/ru-phone-mask";
import { cn } from "@/lib/utils/cn";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
};

export function PhoneInput({ value, onChange, disabled, error, id = "phone" }: PhoneInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Номер телефона
      </label>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(maskRuPhoneInput(e.target.value))}
        placeholder="+7 900 123-45-67"
        className={cn(
          "mt-2 w-full rounded-xl border px-4 py-3 font-mono text-base tracking-wide",
          "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950",
          "focus:border-[var(--clinical-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--clinical-primary)]/20",
          disabled && "opacity-60",
          error && "border-red-400 focus:ring-red-200",
        )}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
