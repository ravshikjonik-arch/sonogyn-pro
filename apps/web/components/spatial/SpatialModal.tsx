"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

type SpatialModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SpatialModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: SpatialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sg-spatial-sheet max-h-[min(86vh,760px)] overflow-y-auto border-[var(--clinical-border)] bg-[var(--sg-surface-raised)] p-0 shadow-[var(--sg-depth-modal)] backdrop-blur-[var(--sg-blur-modal)]",
          "max-md:!top-auto max-md:!bottom-0 max-md:!left-0 max-md:!max-h-[min(88vh,820px)] max-md:!w-full max-md:!max-w-none max-md:!-translate-x-0 max-md:!translate-y-0 max-md:rounded-b-none max-md:rounded-t-[var(--sg-radius-xl)] max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
          "md:rounded-[var(--sg-radius-xl)] md:max-h-[min(86vh,760px)]",
          className,
        )}
      >
        <DialogHeader className="border-b border-[var(--clinical-border)] px-5 py-4 text-left">
          <DialogTitle className="text-lg font-black text-[var(--clinical-foreground)]">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-[var(--clinical-foreground-muted)]">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="px-5 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
