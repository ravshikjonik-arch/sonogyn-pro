"use client";

import { useEffect, useState } from "react";

import { fetalSpineImageSrc } from "@/lib/education/fetal-spine/constants";
import { cn } from "@/lib/utils/cn";

type FetalSpineCardImageProps = {
  imageId: number;
  title?: string;
  className?: string;
  variant?: "thumb" | "full";
  onClick?: () => void;
};

export function FetalSpineCardImage({
  imageId,
  title,
  className,
  variant = "full",
  onClick,
}: FetalSpineCardImageProps) {
  const src = fetalSpineImageSrc(imageId);
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
          "flex flex-col items-center justify-center bg-gradient-to-br from-[var(--clinical-primary-deep)] to-[var(--clinical-primary)] text-white",
          variant === "thumb" ? "aspect-[3/4] min-h-[160px]" : "min-h-[320px]",
          className,
        )}
      >
        <span className="text-5xl font-black opacity-30">{String(imageId).padStart(2, "0")}</span>
        <span className="mt-2 max-w-[85%] text-center text-sm font-semibold opacity-90">{title}</span>
      </div>
    );
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-[var(--clinical-muted)]/40",
        variant === "thumb" ? "aspect-[3/4]" : "min-h-[280px] sm:min-h-[480px]",
        onClick &&
          "cursor-zoom-in transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]",
        className,
      )}
    >
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-[var(--clinical-muted)]" aria-hidden />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
