"use client";

import { useEffect, useRef, useState } from "react";

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
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setFailed(false);
    setLoaded(false);
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [imageId, src]);

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
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--clinical-muted)]/60"
          aria-hidden
        >
          <span className="text-3xl font-black text-[var(--clinical-foreground-muted)]/40">
            {String(imageId).padStart(2, "0")}
          </span>
          <span className="h-1 w-16 animate-pulse rounded-full bg-[var(--clinical-primary)]/30" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title ?? `УЗИ-карточка ${imageId}`}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          loadedRef.current = true;
          setLoaded(true);
        }}
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
