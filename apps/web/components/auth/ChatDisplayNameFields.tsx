"use client";

import { buildFioAbbreviation, normalizeRussianFio } from "@/lib/auth/doctor-display";
import { cn } from "@/lib/utils/cn";

export type ChatNameMode = "fio" | "nick";

type Props = {
  mode: ChatNameMode;
  nickname: string;
  fullNamePreview?: string;
  onModeChange: (mode: ChatNameMode) => void;
  onNicknameChange: (value: string) => void;
  /** Compact for registration wizard */
  compact?: boolean;
  className?: string;
};

export function ChatDisplayNameFields({
  mode,
  nickname,
  fullNamePreview = "",
  onModeChange,
  onNicknameChange,
  compact = false,
  className,
}: Props) {
  const fioPreview =
    fullNamePreview.trim().length > 0
      ? buildFioAbbreviation(normalizeRussianFio(fullNamePreview)) ?? fullNamePreview.trim()
      : "Фамилия И.О.";
  const nickPreview = nickname.trim().length >= 2 ? nickname.trim() : "ВашНик";

  return (
    <fieldset
      className={cn(
        "rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4",
        className,
      )}
    >
      <legend className="px-1 text-sm font-semibold text-[var(--clinical-foreground)]">
        Имя в чате врачей
      </legend>
      <p
        className={cn(
          "mt-1 text-[var(--clinical-foreground-muted)]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        Коллеги увидят выбранный вариант. ФИО в кабинете не меняется.
      </p>

      <div
        className="mt-3 grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Как показывать имя в чате"
      >
        {(
          [
            { id: "fio" as const, label: "ФИО", hint: fioPreview },
            { id: "nick" as const, label: "Ник", hint: nickPreview },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={mode === opt.id}
            onClick={() => onModeChange(opt.id)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
              mode === opt.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-card)] shadow-sm"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)]/60 hover:border-[var(--clinical-primary)]/50",
            )}
          >
            <span className="block text-sm font-bold text-[var(--clinical-foreground)]">
              {opt.label}
            </span>
            <span className="mt-0.5 block truncate text-xs text-[var(--clinical-foreground-muted)]">
              {opt.hint}
            </span>
          </button>
        ))}
      </div>

      {mode === "nick" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Ник</span>
          <input
            className="mt-1.5 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2.5 text-sm text-[var(--clinical-foreground)] outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)]"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="Например: SonoDoc"
            autoComplete="nickname"
            maxLength={32}
            aria-label="Ник в чате"
            required
          />
          <span className="mt-1 block text-[11px] text-[var(--clinical-foreground-muted)]">
            2–32 символа: буквы, цифры, _ . -
          </span>
        </label>
      ) : null}
    </fieldset>
  );
}
