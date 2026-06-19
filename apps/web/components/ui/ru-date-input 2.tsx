"use client";

import { forwardRef, useEffect, useState } from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { isoFromRu, maskRuDateInput, parseRuDate, ruFromIso } from "@/lib/utils/ru-date";

export type RuDateInputProps = Omit<InputProps, "type" | "value" | "onChange"> & {
  /** ISO YYYY-MM-DD */
  value?: string;
  onChange?: (iso: string | undefined) => void;
  onValidityChange?: (valid: boolean) => void;
};

export const RuDateInput = forwardRef<HTMLInputElement, RuDateInputProps>(
  ({ value, onChange, onValidityChange, className, placeholder = "дд.мм.гггг", ...props }, ref) => {
    const [text, setText] = useState(() => ruFromIso(value));
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
      setText(ruFromIso(value));
      setInvalid(false);
    }, [value]);

    function commit(next: string) {
      const masked = maskRuDateInput(next);
      setText(masked);
      if (!masked) {
        setInvalid(false);
        onChange?.(undefined);
        onValidityChange?.(true);
        return;
      }
      const parsed = parseRuDate(masked);
      if (parsed) {
        setInvalid(false);
        onChange?.(isoFromRu(masked));
        onValidityChange?.(true);
      } else {
        const incomplete = masked.length < 10;
        setInvalid(!incomplete);
        onValidityChange?.(incomplete);
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        className={cn(
          "font-mono text-lg tracking-wide",
          invalid && "border-red-500/60 focus-visible:ring-red-500/40",
          className,
        )}
        value={text}
        onChange={(e) => commit(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = e.clipboardData.getData("text");
          commit(pasted);
        }}
        onBlur={() => {
          if (text && parseRuDate(text) === null && text.length >= 6) {
            setInvalid(true);
            onValidityChange?.(false);
          }
        }}
        {...props}
      />
    );
  },
);

RuDateInput.displayName = "RuDateInput";
