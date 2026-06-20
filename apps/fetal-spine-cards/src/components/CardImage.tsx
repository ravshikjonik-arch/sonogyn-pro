import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type CardImageProps = {
  imageId: number;
  title?: string;
  className?: string;
  variant?: "thumb" | "full";
  onClick?: () => void;
};

function padId(id: number): string {
  return String(id).padStart(2, "0");
}

export function CardImage({ imageId, title, className, variant = "full", onClick }: CardImageProps) {
  const src = `/images/card_${padId(imageId)}.jpeg`;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [imageId]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-gradient-to-br from-medical-navy-deep via-medical-navy to-medical-teal/80 text-white",
          variant === "thumb" ? "aspect-[3/4] min-h-[160px]" : "min-h-[320px] sm:min-h-[480px]",
          className,
        )}
        aria-label={title ?? `Карточка ${imageId}`}
      >
        <span className="text-6xl font-black opacity-25">{padId(imageId)}</span>
        <span className="mt-3 max-w-[85%] text-center text-sm font-semibold opacity-90">{title}</span>
        <span className="mt-2 text-xs opacity-60">card_{padId(imageId)}.jpeg</span>
      </div>
    );
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-[#f8fafc]",
        variant === "thumb" ? "aspect-[3/4]" : "min-h-[280px] sm:min-h-[520px]",
        onClick && "cursor-zoom-in transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-teal",
        className,
      )}
    >
      {!loaded ? <div className="absolute inset-0 skeleton" aria-hidden /> : null}
      <img
        src={src}
        alt={title ?? `УЗИ-карточка ${imageId}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "max-h-full w-full object-contain object-center transition-opacity duration-300",
          variant === "thumb" ? "max-h-[220px] p-1" : "p-2 sm:p-4",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </Wrapper>
  );
}
