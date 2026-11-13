"use client";

import Link from "next/link";

import { LEGAL_DOCS_VERSION } from "@/lib/config/legal";
import { cn } from "@/lib/utils/cn";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  className?: string;
};

/** Обязательное согласие с Политикой и Офертой (152-ФЗ). */
export function LegalConsentCheckbox({
  checked,
  onChange,
  id = "legal-consent",
  className,
}: Props) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-left text-xs leading-relaxed text-[var(--clinical-foreground)]",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--clinical-border)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span>
        Я ознакомлен(а) с{" "}
        <Link href="/privacy" className="font-semibold underline underline-offset-2" target="_blank">
          Политикой конфиденциальности
        </Link>{" "}
        и{" "}
        <Link href="/offer" className="font-semibold underline underline-offset-2" target="_blank">
          Офертой
        </Link>{" "}
        (ред. {LEGAL_DOCS_VERSION}) и даю согласие на обработку персональных данных.
      </span>
    </label>
  );
}
