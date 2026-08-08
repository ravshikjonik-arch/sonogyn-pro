import type { ReactNode } from "react";

import { SpatialCard } from "@/components/spatial/SpatialCard";
import { cn } from "@/lib/utils/cn";

type ContinuationDockProps = {
  children: ReactNode;
  className?: string;
};

export function ContinuationDock({ children, className }: ContinuationDockProps) {
  return (
    <SpatialCard
      depth={2}
      className={cn(
        "sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-2 p-3 lg:bottom-4",
        className,
      )}
    >
      {children}
    </SpatialCard>
  );
}
