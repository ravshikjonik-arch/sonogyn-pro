import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "clinical-form-control flex min-h-[100px] w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm text-[var(--clinical-foreground)] shadow-inner outline-none transition placeholder:text-[var(--clinical-foreground-muted)] focus-visible:ring-2 focus-visible:ring-[var(--clinical-ring)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
