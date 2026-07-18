"use client";

import { useCallback, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CaseMediaPin = {
  id: string;
  x: number;
  y: number;
  label: string;
};

const ANNOTATIONS_PREFIX = "sonogyn:case-annotations:";

function loadPins(mediaId: string): CaseMediaPin[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`${ANNOTATIONS_PREFIX}${mediaId}`) ?? "[]") as CaseMediaPin[];
  } catch {
    return [];
  }
}

function savePins(mediaId: string, pins: CaseMediaPin[]): void {
  localStorage.setItem(`${ANNOTATIONS_PREFIX}${mediaId}`, JSON.stringify(pins));
}

type Props = {
  mediaId: string;
  url: string;
  alt?: string;
  canAnnotate?: boolean;
};

export function CaseMediaViewer({ mediaId, url, alt = "Снимок кейса", canAnnotate = false }: Props) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pins, setPins] = useState<CaseMediaPin[]>(() => loadPins(mediaId));
  const [pinMode, setPinMode] = useState(false);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const addPin = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pinMode || !canAnnotate || !imgWrapRef.current) return;
      const rect = imgWrapRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const label = window.prompt("Подпись к метке (опционально):") ?? "";
      const next: CaseMediaPin = {
        id: crypto.randomUUID(),
        x,
        y,
        label: label.trim() || `Метка ${pins.length + 1}`,
      };
      const updated = [...pins, next];
      setPins(updated);
      savePins(mediaId, updated);
      setPinMode(false);
    },
    [canAnnotate, mediaId, pinMode, pins.length, pins],
  );

  return (
    <>
      <button
        type="button"
        className="group relative block w-full cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="max-h-56 w-full object-contain" />
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="inline h-3 w-3" /> Увеличить
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-8">
              <span>Radiopaedia-style viewer</span>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="outline" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-xs">{Math.round(scale * 100)}%</span>
                <Button type="button" size="icon" variant="outline" onClick={() => setScale((s) => Math.min(4, s + 0.25))}>
                  <Plus className="h-4 w-4" />
                </Button>
                {canAnnotate ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={pinMode ? "default" : "outline"}
                    onClick={() => setPinMode((v) => !v)}
                  >
                    {pinMode ? "Клик на снимок…" : "Метка"}
                  </Button>
                ) : null}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div
            ref={imgWrapRef}
            className="relative max-h-[70vh] overflow-auto rounded-lg border bg-black/90"
            onClick={addPin}
            role="presentation"
          >
            <div
              className="relative inline-block min-w-full origin-top-left transition-transform"
              style={{ transform: `scale(${scale})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={alt} className="mx-auto max-h-[65vh] w-auto object-contain" draggable={false} />
              {pins.map((pin) => (
                <span
                  key={pin.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                  style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                  title={pin.label}
                >
                  ●
                </span>
              ))}
            </div>
          </div>
          {pins.length > 0 && (
            <ul className="max-h-24 overflow-y-auto text-xs text-[var(--clinical-foreground-muted)]">
              {pins.map((p) => (
                <li key={p.id}>
                  {p.label} ({Math.round(p.x * 100)}%, {Math.round(p.y * 100)}%)
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
