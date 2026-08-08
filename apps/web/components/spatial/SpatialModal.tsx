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
          "max-h-[min(86vh,760px)] overflow-y-auto rounded-[var(--sg-radius-xl)] border-[var(--clinical-border)] bg-[var(--sg-surface-raised)] p-0 shadow-[var(--sg-depth-modal)] backdrop-blur-[var(--sg-blur-modal)]",
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
