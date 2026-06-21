/**
 * Генератор grayscale TVUS-схем FIGO (2048×2048, без подписей).
 * Образовательный атлас MUSA/FIGO — не заменяет реальное УЗИ.
 */

import type { FigoDisplayCode } from "@repo/clinical-3d";

type FibroidSpec = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  peduncle?: { x1: number; y1: number; x2: number; y2: number };
};

const SPECS: Record<string, FibroidSpec> = {
  "0": { cx: 980, cy: 1180, rx: 120, ry: 95, peduncle: { x1: 980, y1: 1080, x2: 980, y2: 980 } },
  "1": { cx: 960, cy: 1040, rx: 150, ry: 110 },
  "2": { cx: 940, cy: 980, rx: 170, ry: 150 },
  "3": { cx: 900, cy: 960, rx: 160, ry: 130 },
  "4": { cx: 880, cy: 980, rx: 150, ry: 140 },
  "5": { cx: 860, cy: 940, rx: 165, ry: 145 },
  "6": { cx: 820, cy: 880, rx: 140, ry: 120 },
  "7": { cx: 780, cy: 820, rx: 115, ry: 95, peduncle: { x1: 820, y1: 880, x2: 860, y2: 940 } },
  "8": { cx: 1180, cy: 1320, rx: 130, ry: 110 },
  "2-5": { cx: 900, cy: 980, rx: 185, ry: 220 },
  "3-5": { cx: 890, cy: 990, rx: 175, ry: 210 },
};

function noiseFilter(id: string) {
  return (
    <filter id={id} x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="n" />
      <feColorMatrix type="saturate" values="0" in="n" result="gn" />
      <feBlend in="SourceGraphic" in2="gn" mode="multiply" />
    </filter>
  );
}

function uterusBody() {
  return (
    <>
      <ellipse cx="1024" cy="1020" rx="420" ry="520" fill="#3a3a3a" opacity="0.95" />
      <ellipse cx="1024" cy="1040" rx="360" ry="460" fill="#4a4a4a" />
      <path
        d="M640 1180 Q1024 860 1408 1180 Q1024 1420 640 1180 Z"
        fill="#5c5c5c"
        opacity="0.55"
      />
      <ellipse cx="1024" cy="1080" rx="200" ry="130" fill="#8a8a8a" opacity="0.85" />
      <ellipse cx="1024" cy="1090" rx="160" ry="90" fill="#b8b8b8" opacity="0.9" />
    </>
  );
}

function fibroid(spec: FibroidSpec) {
  return (
    <>
      {spec.peduncle ? (
        <line
          x1={spec.peduncle.x1}
          y1={spec.peduncle.y1}
          x2={spec.peduncle.x2}
          y2={spec.peduncle.y2}
          stroke="#2a2a2a"
          strokeWidth="14"
          strokeLinecap="round"
        />
      ) : null}
      <ellipse cx={spec.cx} cy={spec.cy} rx={spec.rx} ry={spec.ry} fill="#252525" opacity="0.92" />
      <ellipse
        cx={spec.cx - spec.rx * 0.15}
        cy={spec.cy - spec.ry * 0.12}
        rx={spec.rx * 0.55}
        ry={spec.ry * 0.5}
        fill="#1a1a1a"
        opacity="0.35"
      />
    </>
  );
}

export function FigoUsSchematic({
  code,
  className,
  size = 512,
}: {
  code: FigoDisplayCode | string;
  className?: string;
  size?: number;
}) {
  const key = String(code);
  const spec = SPECS[key] ?? SPECS["4"]!;
  const fid = `figo-grain-${key.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox="0 0 2048 2048"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`FIGO ${key} ultrasound schematic`}
    >
      <rect width="2048" height="2048" fill="#050505" />
      {noiseFilter(fid)}
      <g filter={`url(#${fid})`}>
        {uterusBody()}
        {fibroid(spec)}
      </g>
    </svg>
  );
}

export function figoSchematicSrc(code: FigoDisplayCode | string): string {
  return `/atlas/figo-us/figo-${String(code)}.svg`;
}
