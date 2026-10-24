"use client";

import { useRef, type KeyboardEvent } from "react";

import { authInputClass } from "@/components/auth/AuthScreenShell";
import { cn } from "@/lib/utils/cn";

type Props = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
};

export function OtpDigitRow({ length = 4, value, onChange, disabled, label = "Код подтверждения" }: Props) {
  const digits = value.padEnd(length, " ").slice(0, length).split("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setAt(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d === " " ? "" : d));
    onChange(next.join("").replace(/\s/g, "").slice(0, length));
  }

  function onInput(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) {
      setAt(index, "");
      return;
    }
    setAt(index, char);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div>
      <span className="sr-only">{label}</span>
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            aria-label={`${label}, цифра ${i + 1}`}
            className={cn(
              authInputClass,
              "h-14 w-12 text-center text-xl font-bold tracking-widest sm:h-16 sm:w-14",
            )}
            value={d.trim()}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>
    </div>
  );
}
