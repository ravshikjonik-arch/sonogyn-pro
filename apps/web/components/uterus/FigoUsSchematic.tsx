/**
 * Учебная сагиттальная схема матки для атласа FIGO (MUSA/FIGO).
 * Clinical teaching plate — без фейкового TVUS-зерна. Не заменяет реальное УЗИ.
 */

import type { FigoDisplayCode } from "@repo/clinical-3d";

type FibroidSpec = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  peduncle?: { x1: number; y1: number; x2: number; y2: number };
};

/**
 * Координаты узла относительно сагиттального контура:
 * полость ≈ (1024, 980–1180), миометрий вокруг, сероза снаружи,
 * шейка снизу (~1024, 1480), дно сверху (~1024, 620).
 */
const SPECS: Record<string, FibroidSpec> = {
  "0": {
    cx: 1024,
    cy: 1088,
    rx: 88,
    ry: 72,
    peduncle: { x1: 1024, y1: 1010, x2: 1024, y2: 980 },
  },
  "1": { cx: 1024, cy: 1005, rx: 118, ry: 95 },
  "2": { cx: 1000, cy: 960, rx: 132, ry: 118 },
  "3": { cx: 940, cy: 990, rx: 120, ry: 108 },
  "4": { cx: 880, cy: 980, rx: 118, ry: 110 },
  "5": { cx: 820, cy: 940, rx: 125, ry: 112 },
  "6": { cx: 760, cy: 900, rx: 108, ry: 92 },
  "7": {
    cx: 700,
    cy: 820,
    rx: 95,
    ry: 80,
    peduncle: { x1: 760, y1: 880, x2: 820, y2: 940 },
  },
  "8": { cx: 1024, cy: 1420, rx: 100, ry: 88 },
  "1-5": { cx: 960, cy: 980, rx: 145, ry: 195 },
  "1-6": { cx: 930, cy: 955, rx: 150, ry: 215 },
  "2-5": { cx: 945, cy: 975, rx: 148, ry: 190 },
  "2-6": { cx: 920, cy: 950, rx: 155, ry: 210 },
  "3-5": { cx: 930, cy: 985, rx: 140, ry: 180 },
};

/** Наружный контур матки: дно → тело → шейка (сагиттально). */
const UTERUS_OUTER =
  "M1024 560 C1180 560 1320 640 1360 780 C1400 920 1380 1080 1320 1220 C1260 1360 1180 1460 1100 1520 C1060 1550 1040 1580 1024 1620 C1008 1580 988 1550 948 1520 C868 1460 788 1360 728 1220 C668 1080 648 920 688 780 C728 640 868 560 1024 560 Z";

const UTERUS_INNER =
  "M1024 620 C1145 620 1255 685 1288 800 C1322 920 1305 1060 1255 1185 C1205 1310 1140 1395 1075 1450 C1050 1470 1035 1495 1024 1525 C1013 1495 998 1470 973 1450 C908 1395 843 1310 793 1185 C743 1060 726 920 760 800 C793 685 903 620 1024 620 Z";

const CAVITY =
  "M1024 820 C1068 820 1095 900 1095 1000 C1095 1100 1075 1200 1055 1280 C1042 1330 1032 1365 1024 1390 C1016 1365 1006 1330 993 1280 C973 1200 953 1100 953 1000 C953 900 980 820 1024 820 Z";

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
  const uid = key.replace(/[^a-z0-9]/gi, "") || "x";

  const myo = `figo-myo-${uid}`;
  const cavity = `figo-cavity-${uid}`;
  const bg = `figo-bg-${uid}`;
  const node = `figo-node-${uid}`;
  const soft = `figo-soft-${uid}`;

  return (
    <svg
      viewBox="0 0 2048 2048"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`FIGO ${key} · учебная сагиттальная схема матки`}
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="42%" r="68%">
          <stop offset="0%" stopColor="#1e2430" />
          <stop offset="70%" stopColor="#12161e" />
          <stop offset="100%" stopColor="#0a0c10" />
        </radialGradient>
        <linearGradient id={myo} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a6d76" />
          <stop offset="45%" stopColor="#6e5660" />
          <stop offset="100%" stopColor="#4f3f48" />
        </linearGradient>
        <linearGradient id={cavity} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8eef5" />
          <stop offset="100%" stopColor="#b8c4d4" />
        </linearGradient>
        <radialGradient id={node} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <filter id={soft} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b" />
          <feOffset in="b" dy="2" result="o" />
          <feMerge>
            <feMergeNode in="o" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="2048" height="2048" fill={`url(#${bg})`} />
      <ellipse cx="1024" cy="1040" rx="780" ry="860" fill="none" stroke="#2a3344" strokeWidth="2" opacity="0.45" />

      <path
        d={UTERUS_OUTER}
        fill={`url(#${myo})`}
        stroke="#9aa3b2"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d={UTERUS_INNER} fill="#6b5660" opacity="0.35" />
      <path d={CAVITY} fill={`url(#${cavity})`} stroke="#e8eef6" strokeWidth="5" opacity="0.95" />
      <path
        d="M1024 860 L1024 1360"
        stroke="#f4f7fb"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M1024 860 L1024 1360"
        stroke="#c5d0de"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M1024 1390 L1024 1585"
        stroke="#d7dee8"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.55"
      />

      <g key={key}>
        {spec.peduncle ? (
          <line
            x1={spec.peduncle.x1}
            y1={spec.peduncle.y1}
            x2={spec.peduncle.x2}
            y2={spec.peduncle.y2}
            stroke="#b45309"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.85"
          />
        ) : null}
        <ellipse
          cx={spec.cx}
          cy={spec.cy}
          rx={spec.rx}
          ry={spec.ry}
          fill={`url(#${node})`}
          stroke="#f59e0b"
          strokeWidth="6"
          filter={`url(#${soft})`}
        />
        <ellipse
          cx={spec.cx - spec.rx * 0.22}
          cy={spec.cy - spec.ry * 0.2}
          rx={spec.rx * 0.42}
          ry={spec.ry * 0.36}
          fill="#fde68a"
          opacity="0.28"
        />
      </g>

      <text
        x="1024"
        y="1920"
        textAnchor="middle"
        fill="#8b95a8"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="42"
        letterSpacing="4"
      >
        {`схема · не снимок УЗИ · FIGO ${key}`}
      </text>
    </svg>
  );
}

export function figoSchematicSrc(code: FigoDisplayCode | string): string {
  return `/atlas/figo-us/figo-${String(code)}.svg`;
}

/** Exported for tests / tooling — fibroid placement table. */
export const FIGO_SCHEMATIC_SPECS = SPECS;
