import type { HTMLAttributes, ReactNode } from "react";

import { SpatialCard } from "@/components/spatial/SpatialCard";
import { cn } from "@/lib/utils/cn";

type ClinicalSheetProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ClinicalSheet({
  title,
  eyebrow,
  actions,
  children,
  className,
  ...props
}: ClinicalSheetProps) {
  return (
    <SpatialCard as="section" depth={1} className={cn("p-4 sm:p-5", className)} {...props}>
      {(title || eyebrow || actions) ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--clinical-foreground)]">
                {title}
              </h2>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </SpatialCard>
  );
}
