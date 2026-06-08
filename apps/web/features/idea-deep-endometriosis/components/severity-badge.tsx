import type { z } from "zod";

import { cn } from "@/lib/utils/cn";
import { severityRu } from "../lib/idea-labels-ru";
import { tendernessSeveritySchema } from "../lib/schema";

type Severity = z.infer<typeof tendernessSeveritySchema>;

const STYLES: Record<Severity, string> = {
  mild: "bg-amber-100 text-amber-900 border-amber-300",
  moderate: "bg-orange-100 text-orange-900 border-orange-300",
  severe: "bg-red-100 text-red-900 border-red-300",
};

export type SeverityBadgeProps = {
  severity: Severity;
  className?: string;
  testId?: string;
};

export function SeverityBadge({ severity, className, testId }: SeverityBadgeProps) {
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        STYLES[severity],
        className,
      )}
    >
      {severityRu[severity]}
    </span>
  );
}
