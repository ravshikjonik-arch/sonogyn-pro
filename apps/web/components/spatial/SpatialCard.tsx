import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type SpatialCardElement = "div" | "section" | "article" | "aside";

type SpatialCardProps = HTMLAttributes<HTMLElement> & {
  as?: SpatialCardElement;
  children: ReactNode;
  depth?: 1 | 2 | 3;
  interactive?: boolean;
};

export function SpatialCard({
  as,
  children,
  className,
  depth = 1,
  interactive = false,
  ...props
}: SpatialCardProps) {
  const Comp = as ?? "div";

  return (
    <Comp
      data-depth={depth}
      data-interactive={interactive}
      className={cn("sg-spatial-card rounded-[var(--sg-radius-lg)]", interactive && "sg-focus-ring", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
