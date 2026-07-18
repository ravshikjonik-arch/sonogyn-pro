"use client";

import Image from "next/image";
import Link from "next/link";

import type { OradsAtlasPreview } from "@/lib/orads-us/resolveOradsAtlasPreview";
import { cn } from "@/lib/utils/cn";

type Props = {
  preview: OradsAtlasPreview | null;
  className?: string;
  compact?: boolean;
};

export function OradsWizardAtlasImage({ preview, className, compact }: Props) {
  if (!preview) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-3 py-4 text-center text-xs text-[var(--clinical-foreground-muted)]",
          className,
        )}
      >
        Эхограмма для этого шага скоро появится
      </div>
    );
  }

  return (
    <figure className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-black/90",
          compact ? "aspect-[16/10]" : "aspect-[4/3]",
        )}
      >
        <Image
          src={preview.src}
          alt={preview.title ?? "Учебная эхограмма O-RADS"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 640px"
        />
      </div>
      {preview.teachingHint ? (
        <figcaption className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          {preview.teachingHint}
        </figcaption>
      ) : null}
      <Link
        href="/tools/refs/orads-echograms"
        className="inline-block text-xs font-semibold text-[var(--clinical-primary-deep)] hover:underline"
      >
        Библиотека эхограмм →
      </Link>
    </figure>
  );
}
