"use client";

import Image from "next/image";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { OradsNosologyAtlasEntry } from "@/lib/orads-pro/nosology-atlas";

type Props = {
  entry: OradsNosologyAtlasEntry;
  compact?: boolean;
};

export function OradsNosologyPreview({ entry, compact }: Props) {
  function copyProtocol() {
    void navigator.clipboard.writeText(entry.protocolText).then(() => toast.success("Формулировка скопирована"));
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20 ${
        compact ? "" : "shadow-sm"
      }`}
    >
      <div className={compact ? "grid gap-3 p-3 sm:grid-cols-[140px_1fr]" : "grid gap-4 p-4 lg:grid-cols-[minmax(180px,240px)_1fr]"}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-black/5">
          <Image
            src={entry.imageSrc}
            alt={entry.imageAlt}
            fill
            className="object-contain"
            sizes={compact ? "140px" : "(max-width: 768px) 100vw, 240px"}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">{entry.titleRu}</p>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80">{entry.oradsHint}</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={copyProtocol}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              В протокол
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{entry.protocolText}</p>
          {entry.realExampleImage && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Реальная эхограмма
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300">из практики</span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-emerald-200 bg-black/5 dark:border-emerald-900">
                <Image
                  src={entry.realExampleImage}
                  alt={entry.imageAlt}
                  fill
                  className="object-contain"
                  sizes={compact ? "140px" : "(max-width: 768px) 100vw, 240px"}
                />
              </div>
              {entry.realExampleCaption && (
                <p className="mt-2 text-xs italic leading-relaxed text-emerald-900 dark:text-emerald-100">
                  {entry.realExampleCaption}
                </p>
              )}
            </div>
          )}
          {entry.realExampleImage2 && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Реальная эхограмма
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300">второй ракурс</span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-emerald-200 bg-black/5 dark:border-emerald-900">
                <Image
                  src={entry.realExampleImage2}
                  alt={entry.imageAlt}
                  fill
                  className="object-contain"
                  sizes={compact ? "140px" : "(max-width: 768px) 100vw, 240px"}
                />
              </div>
              {entry.realExampleCaption2 && (
                <p className="mt-2 text-xs italic leading-relaxed text-emerald-900 dark:text-emerald-100">
                  {entry.realExampleCaption2}
                </p>
              )}
            </div>
          )}
          {entry.realExampleImages?.length ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Галерея реальных эхограмм
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300">O-RADS 5 · рак яичника</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {entry.realExampleImages.map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-emerald-200 bg-black/5 dark:border-emerald-900"
                  >
                    <Image
                      src={src}
                      alt={`${entry.imageAlt} ${idx + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  </div>
                ))}
              </div>
              {entry.realExampleCaptions?.length
                ? entry.realExampleCaptions.map((caption, idx) => (
                    <p
                      key={idx}
                      className="mt-1 text-[10px] italic leading-relaxed text-emerald-900 dark:text-emerald-100"
                    >
                      {caption}
                    </p>
                  ))
                : null}
            </div>
          ) : null}
          {entry.keySignsRu?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {entry.keySignsRu.map((sign) => (
                <span
                  key={sign}
                  className="rounded-full border border-emerald-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                >
                  {sign}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-[10px] text-slate-500">Учебная эхограмма · не заменяет заключение врача</p>
        </div>
      </div>
    </div>
  );
}
