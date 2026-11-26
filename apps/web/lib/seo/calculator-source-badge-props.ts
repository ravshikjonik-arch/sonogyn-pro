import type { ComponentProps } from "react";

import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
import {
  formatClinicalReviewLabel,
  type ClinicalContentReviewStatus,
} from "@/lib/seo/clinical-reviewer";
import type { CalculatorLandingContent } from "@/lib/seo/calculator-landing-content";

type BadgeProps = ComponentProps<typeof CalculatorSourceBadge>;

function organizationForPath(path: string): string | undefined {
  if (path.includes("/rads/ti-rads") || path.includes("/rads/bi-rads") || path.includes("/rads/o-rads") || path.includes("/rads/ln-rads")) {
    return "ACR";
  }
  if (path.includes("/rads/iota")) return "IOTA";
  if (path.includes("/ob/")) return "Акушерство";
  if (path.includes("/gyn/")) return "Гинекология";
  return undefined;
}

function formatSourceLine(s: CalculatorLandingContent["sources"][number]): string {
  return s.year ? `${s.label} (${s.year})` : s.label;
}

/** Компактный badge «источник метода» из SEO-landing (единый для всех калькуляторов с shell). */
export function calculatorSourceBadgeProps(content: CalculatorLandingContent): BadgeProps | null {
  const primary = content.sources[0];
  if (!primary) return null;

  const reference =
    content.sources.length > 1
      ? content.sources.map(formatSourceLine).join(" · ")
      : formatSourceLine(primary);

  const review = formatClinicalReviewLabel(
    content.reviewStatus as ClinicalContentReviewStatus | undefined,
    content.reviewedBy,
  );

  return {
    title: primary.label,
    reference,
    organization: organizationForPath(content.path),
    verified: `Обновлено ${content.updatedAt} · ${review}`,
  };
}