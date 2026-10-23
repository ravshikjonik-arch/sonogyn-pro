"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type SpatialCanvasProps = {
  children: ReactNode;
  className?: string;
  /** Subtle cosmos gradient; respects reduced motion (static only). */
  variant?: "cosmos" | "flat";
};

export function SpatialCanvas({ children, className, variant = "cosmos" }: SpatialCanvasProps) {
  return (
    <div
      className={cn(
        "relative min-h-[100dvh] pb-[env(safe-area-inset-bottom)]",
        variant === "cosmos" && "sonogyn-cosmos-bg sg-spatial-vignette",
        className,
      )}
    >
      {children}
    </div>
  );
}
