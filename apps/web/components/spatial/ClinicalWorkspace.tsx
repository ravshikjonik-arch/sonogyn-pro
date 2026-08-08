import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ClinicalWorkspaceProps = {
  children: ReactNode;
  side?: ReactNode;
  className?: string;
};

export function ClinicalWorkspace({ children, side, className }: ClinicalWorkspaceProps) {
  return (
    <div className={cn("grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]", className)}>
      <div className="min-w-0">{children}</div>
      {side ? <div className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">{side}</div> : null}
    </div>
  );
}
