import { X, ZoomIn } from "lucide-react";
import { useEffect } from "react";

import { CardImage } from "@/components/CardImage";

type ImageLightboxProps = {
  imageId: number;
  title: string;
  open: boolean;
  onClose: () => void;
};

export function ImageLightbox({ imageId, title, open, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-medical-navy-deep/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Увеличить: ${title}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="relative max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-medical-border px-4 py-3">
          <p className="text-sm font-bold text-medical-navy">{title}</p>
          <span className="flex items-center gap-1 text-xs text-medical-muted">
            <ZoomIn className="h-3.5 w-3.5" />
            Нажмите снаружи, чтобы закрыть
          </span>
        </div>
        <CardImage imageId={imageId} title={title} variant="full" className="min-h-[60dvh]" />
      </div>
    </div>
  );
}
