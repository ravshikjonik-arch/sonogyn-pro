"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
  className?: string;
};

export function ReportBlockEditor({ id, label, value, onChange, readOnly, rows = 10, className }: Props) {
  return (
    <section className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--clinical-foreground)]">
        {label}
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        rows={rows}
        className="min-h-[160px] resize-y font-mono text-sm leading-relaxed"
      />
    </section>
  );
}
