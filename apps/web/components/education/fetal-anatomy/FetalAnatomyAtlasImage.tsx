"use client";

import { useState } from "react";

import {
  fetalAnatomyAtlasFallbackSrc,
  fetalAnatomyAtlasSrc,
} from "@/lib/education/fetal-anatomy-22-views/atlas";

type Props = {
  viewId: string;
  kind: "normal" | "pathology";
  alt: string;
  className?: string;
};

/** PNG primary; SVG fallback if PNG missing. */
export function FetalAnatomyAtlasImage({ viewId, kind, alt, className }: Props) {
  const [current, setCurrent] = useState(() => fetalAnatomyAtlasSrc(viewId, kind));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        const fallback = fetalAnatomyAtlasFallbackSrc(viewId, kind);
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
