import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]",
        secondary: "border-transparent bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]",
        outline: "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
        success: "border-transparent bg-emerald-100 text-emerald-900",
        warning: "border-transparent bg-amber-100 text-amber-900",
        destructive: "border-transparent bg-red-100 text-red-900",
        link: "border-transparent text-[var(--clinical-primary)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
