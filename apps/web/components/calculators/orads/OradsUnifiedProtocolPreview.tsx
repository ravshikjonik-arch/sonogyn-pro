"use client";

import type { OradsUs2022Result, OradsUs2022Input } from "@repo/orads-us/pro";
import type { AdnexAssessmentContext, PregnancyObstetricContext } from "@repo/orads-us/pregnancy";
import {
  PREGNANCY_ADNEXAL_MODE_TITLE_RU,
  PREGNANCY_MODE_SHORT_HINT_RU,
  pregnancyBlocksOradsCategory,
  resolveObstetricSummary,
} from "@repo/orads-us/pregnancy";
import { cdssOradsCategoryBandLabel } from "@repo/clinical-tools";
import { ClinicalCdssDisclaimer } from "@/components/clinical/ClinicalCdssDisclaimer";
import { formatOradsPreviewLines } from "@/lib/orads-pro/formatOradsPreviewLines";
import { cn } from "@/lib/utils/cn";

type Props = {
  input: OradsUs2022Input;
  result: OradsUs2022Result | null;
  assessmentContext?: AdnexAssessmentContext;
  obstetric?: PregnancyObstetricContext | null;
  className?: string;
};

/** Правая колонка в духе refero: «лист» протокола + категория (или Pregnancy Mode без O-RADS). */
export function OradsUnifiedProtocolPreview({
  input,
  result,
  assessmentContext = "non_pregnant",
  obstetric = null,
  className,
}: Props) {
  const findings = formatOradsPreviewLines(input);
  const pregnant = pregnancyBlocksOradsCategory(assessmentContext);
  const obstetricSummary = obstetric ? resolveObstetricSummary(obstetric) : null;
  const cat = pregnant || !result ? null : result.category;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-canvas)] p-3 shadow-[var(--clinical-card-shadow)]",
        className,
      )}
    >
      <div
        className="rounded-lg bg-[var(--clinical-card)] px-5 py-6 sm:px-7 sm:py-8"
        role="region"
        aria-label={
          pregnant
            ? `Превью · ${PREGNANCY_ADNEXAL_MODE_TITLE_RU}`
            : "Превью стратификации O-RADS US v2022"
        }
        aria-live="polite"
        aria-atomic="true"
      >
        {pregnant ? (
          <>
            <p className="text-lg font-semibold text-[var(--clinical-accent-teal)]">
              {PREGNANCY_ADNEXAL_MODE_TITLE_RU}
            </p>
            <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
              Adnexa · без категорий O-RADS
            </p>
            {obstetricSummary?.gaLabel ? (
              <p className="mt-2 text-sm text-[var(--clinical-foreground)]" data-e2e-orads-preview-ga>
                Срок: {obstetricSummary.gaLabel}
                {obstetricSummary.trimesterLabel ? ` · ${obstetricSummary.trimesterLabel}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">Срок: не указан</p>
            )}
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-[var(--clinical-accent-teal)]">O-RADS US v2022</p>
            <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
              Adnexa · стратификация риска
            </p>
          </>
        )}

        <div className="mt-6 border-t border-[var(--clinical-border)] pt-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--clinical-accent-teal)]">
            Ultrasound findings
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--clinical-foreground)]">
            {findings.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[var(--clinical-foreground-muted)]" aria-hidden>
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-[var(--clinical-border)] pt-5">
          {pregnant ? (
            <>
              <p className="text-xs font-semibold tracking-wide text-[var(--clinical-accent-teal)]">
                Assessment
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--clinical-foreground)]" data-e2e-orads-category="">
                Категория O-RADS не присваивается
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                {PREGNANCY_MODE_SHORT_HINT_RU}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-wide text-[var(--clinical-accent-teal)]">
                Stratification
              </p>
              {cat === null || !result ? (
                <p className="mt-2 text-sm font-medium text-[var(--clinical-foreground)]">
                  {result?.title ?? "Категория не определена"}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm font-medium text-[var(--clinical-foreground-muted)]">
                    Категория O-RADS
                  </p>
                  <p
                    className="mt-1 text-4xl font-semibold tabular-nums text-[var(--clinical-foreground)]"
                    data-e2e-orads-category={cat}
                  >
                    {cat}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--clinical-foreground)]">
                    {cdssOradsCategoryBandLabel(cat)}
                  </p>
                </>
              )}
              {result ? (
                <>
                  <p className="mt-2 text-sm font-medium">
                    <span className="text-[var(--clinical-foreground-muted)]">ROM: </span>
                    {result.risk}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">{result.rationale}</p>
                  <p className="mt-2 whitespace-pre-line text-sm font-medium">{result.management}</p>
                  {result.warning ? (
                    <p
                      className="mt-2 rounded-md border border-amber-500/35 bg-amber-50/90 px-3 py-2 text-sm text-[var(--clinical-foreground)] dark:bg-amber-950/40"
                      role="note"
                    >
                      {result.warning}
                    </p>
                  ) : null}
                  {result.missing.length ? (
                    <ul
                      className="mt-3 space-y-1 text-xs text-[var(--clinical-foreground-muted)]"
                      aria-label="Незаполненные поля"
                    >
                      {result.missing.map((m) => (
                        <li key={m}>— {m}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>

        <ClinicalCdssDisclaimer className="mt-6" />
      </div>
    </div>
  );
}
