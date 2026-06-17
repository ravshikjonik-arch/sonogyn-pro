"use client";

/** Учебный макет POP-Q: где измерять точки относительно гимена (0). */
export function PopQAnatomyMockup({ uterusPresent = true }: { uterusPresent?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-orange-50 p-3">
      <svg viewBox="0 0 420 300" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Макет точек POP-Q">
        <defs>
          <linearGradient id="vagGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
        </defs>

        <text x="16" y="22" className="fill-rose-950 text-[13px] font-bold">
          Макет POP-Q для врача
        </text>
        <text x="16" y="40" className="fill-slate-600 text-[10px]">
          Минус — выше гимена · 0 — гимен · Плюс — ниже
        </text>

        {/* vaginal canal */}
        <ellipse cx="210" cy="145" rx="58" ry="92" fill="url(#vagGrad)" stroke="#e11d48" strokeWidth="2.5" />
        {/* uterus simplified */}
        {uterusPresent ? (
          <path d="M170 58 C210 20 250 20 250 58 L250 95 C210 110 170 110 170 95 Z" fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
        ) : (
          <text x="168" y="78" className="fill-slate-500 text-[10px] font-semibold">
            культя (C)
          </text>
        )}

        {/* hymen zero line */}
        <line x1="90" y1="188" x2="330" y2="188" stroke="#7c2d12" strokeWidth="2.5" strokeDasharray="6 4" />
        <text x="336" y="192" className="fill-amber-950 text-[11px] font-bold">
          гимен 0
        </text>

        {/* scale ticks */}
        {[-3, -1, 0, 1, 3].map((cm) => {
          const y = 188 + cm * 11;
          return (
            <g key={cm}>
              <line x1="78" y1={y} x2="88" y2={y} stroke="#64748b" strokeWidth="1.5" />
              <text x="52" y={y + 4} className="fill-slate-600 text-[9px] font-semibold">
                {cm > 0 ? `+${cm}` : cm}
              </text>
            </g>
          );
        })}

        {/* point markers (reference positions) */}
        <Point x={132} y={155} label="Aa" hint="-3" color="#1d4ed8" />
        <Point x={148} y={170} label="Ba" hint="низ передней" color="#1d4ed8" />
        <Point x={210} y={118} label="C" hint="шейка" color="#7c3aed" />
        {uterusPresent ? <Point x={268} y={132} label="D" hint="задний свод" color="#7c3aed" /> : null}
        <Point x={132} y={210} label="Ap" hint="-3" color="#0f766e" />
        <Point x={148} y={225} label="Bp" hint="низ задней" color="#0f766e" />

        {/* GH / PB / TVL hints */}
        <text x="300" y="170" className="fill-blue-800 text-[10px] font-semibold">
          GH
        </text>
        <text x="300" y="182" className="fill-slate-500 text-[9px]">
          уретра → гимен
        </text>
        <text x="300" y="214" className="fill-violet-800 text-[10px] font-semibold">
          PB
        </text>
        <text x="300" y="226" className="fill-slate-500 text-[9px]">
          гимен → анус
        </text>
        <text x="300" y="258" className="fill-rose-900 text-[10px] font-semibold">
          TVL
        </text>
        <text x="300" y="270" className="fill-slate-500 text-[9px]">
          длина при вправлении
        </text>

        <rect x="16" y="248" width="388" height="42" rx="10" fill="#fff7ed" stroke="#fdba74" />
        <text x="28" y="266" className="fill-amber-950 text-[10px]">
          Стадию считаем по самой нижней точке среди Aa · Ba · Ap · Bp · C{uterusPresent ? " · D" : ""}.
        </text>
        <text x="28" y="280" className="fill-amber-900 text-[10px]">
          GH, PB, TVL — для протокола; TVL нужна для границы стадии IV.
        </text>
      </svg>
    </div>
  );
}

function Point({
  x,
  y,
  label,
  hint,
  color,
}: {
  x: number;
  y: number;
  label: string;
  hint: string;
  color: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={color} stroke="#fff" strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
        {label}
      </text>
      <text x={x} y={y - 14} textAnchor="middle" className="fill-slate-700 text-[8px] font-semibold">
        {hint}
      </text>
    </g>
  );
}
