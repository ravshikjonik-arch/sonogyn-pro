import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SonoOrbProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
};

export function SonoOrb({ label = "SG", size = "md", className, ...props }: SonoOrbProps) {
  return (
    <div
      className={cn(
        "sg-orb flex shrink-0 items-center justify-center rounded-[var(--sg-radius-md)] font-black text-white",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {label}
    </div>
  );
}
