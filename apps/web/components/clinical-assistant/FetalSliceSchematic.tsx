"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

type Props = { sliceId: string; className?: string };

const SLICE_ASSETS: Record<string, string> = {
  "head-trans": "/clinical/fetal-slices/head-trans.svg",
  "head-cerebellum": "/clinical/fetal-slices/head-cerebellum.svg",
  "face-profile": "/clinical/fetal-slices/face-profile.svg",
  "face-orbit": "/clinical/fetal-slices/face-orbit.svg",
  "heart-4ch": "/clinical/fetal-slices/heart-4ch.svg",
  "heart-outflow": "/clinical/fetal-slices/heart-outflow.svg",
  spine: "/clinical/fetal-slices/spine.svg",
  abdomen: "/clinical/fetal-slices/abdomen.svg",
};

function InlineFallback({ sliceId }: { sliceId: string }) {
  const stroke = "currentColor";
  const fill = "rgba(124,58,237,0.12)";
  return (
    <svg viewBox="0 0 80 56" className="h-full w-full" aria-hidden>
      <ellipse cx="40" cy="28" rx="26" ry="22" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <text x="40" y="32" textAnchor="middle" fontSize="6" fill={stroke}>
        {sliceId.slice(0, 8)}
      </text>
    </svg>
  );
}

export function FetalSliceSchematic({ sliceId, className }: Props) {
  const src = SLICE_ASSETS[sliceId];
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn("relative h-14 w-20 shrink-0 text-violet-700 dark:text-violet-300", className)}>
        <InlineFallback sliceId={sliceId} />
      </div>
    );
  }

  return (
    <div className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-violet-100/50 dark:bg-violet-950/40", className)}>
      <Image
        src={src}
        alt=""
        fill
        className="object-contain p-1"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
