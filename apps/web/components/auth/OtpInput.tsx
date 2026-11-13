"use client";

import { AUTH_OTP_DIGITS, normalizeOtpInput } from "@/lib/auth/otp-digits";
import { cn } from "@/lib/utils/cn";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
};

export function OtpInput({ value, onChange, disabled, error, id = "otp" }: OtpInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Код из SMS (6 цифр)
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={AUTH_OTP_DIGITS}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(normalizeOtpInput(e.target.value))}
        placeholder="123456"
        className={cn(
          "mt-2 w-full rounded-xl border px-4 py-3 text-center font-mono text-2xl tracking-[0.35em]",
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
