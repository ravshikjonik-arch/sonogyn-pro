"use client";

import Image from "next/image";
import { useState } from "react";

import { pathologyImageUrl } from "@/lib/tirads-acr";

const PREFER_PNG = process.env.NEXT_PUBLIC_TIRADS_ATLAS_PREFER_PNG !== "false";

type Props = {
  imageFile: string;
  alt: string;
  className?: string;
};

/** Atlas image: PNG (production) → SVG fallback. */
export function TiradsAtlasImage({ imageFile, alt, className }: Props) {
  const [src, setSrc] = useState(() => pathologyImageUrl(imageFile, PREFER_PNG));

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className ?? "object-contain p-2"}
      sizes="400px"
      onError={() => {
        const svg = pathologyImageUrl(imageFile, false);
        if (src !== svg) setSrc(svg);
      }}
    />
  );
}
