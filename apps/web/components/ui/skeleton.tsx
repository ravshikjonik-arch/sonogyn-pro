import * as React from "react";

import { cn } from "@/lib/utils/cn";

/** Премиум skeleton с shimmer-эффектом (класс из globals.css). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} {...props} />;
}
