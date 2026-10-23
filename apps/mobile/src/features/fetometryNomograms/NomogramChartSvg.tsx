import Svg, { Circle, Path, Rect, Text as SvgText } from "react-native-svg";

import type { NomogramChartSeries } from "@repo/fetal-nomograms";

const W = 360;
const H = 200;
const PAD = { t: 12, r: 12, b: 32, l: 40 };

function scale(value: number, min: number, max: number, outMin: number, outMax: number) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

type Props = {
  series: NomogramChartSeries;
  markerX?: number;
  markerY?: number;
};

export function NomogramChartSvg({ series, markerX, markerY }: Props) {
  const xs = series.points.map((p) => p.x);
  const ys = series.points.flatMap((p) => [p.p5, p.p50, p.p95].filter((v): v is number => v != null));
  if (markerY != null) ys.push(markerY);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const sx = (x: number) => scale(x, xMin, xMax, PAD.l, PAD.l + innerW);
  const sy = (y: number) => scale(y, yMin, yMax, PAD.t + innerH, PAD.t);

  const line = (field: "p5" | "p50" | "p95") =>
    series.points
      .filter((p) => p[field] != null)
      .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p[field]!).toFixed(1)}`)
      .join(" ");

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`Номограмма ${series.title}`}>
      <Rect x={0} y={0} width={W} height={H} fill="transparent" />
      {[line("p5"), line("p50"), line("p95")].map((d, i) => (
        <Path
          key={i}
          d={d}
          fill="none"
          stroke="#0F2744"
          strokeWidth={i === 1 ? 2 : 1}
          opacity={i === 1 ? 0.85 : 0.45}
          strokeDasharray={i === 0 || i === 2 ? "4 3" : undefined}
        />
      ))}
      {markerX != null && markerY != null ? (
        <Circle cx={sx(markerX)} cy={sy(markerY)} r={5} fill="#0d9488" stroke="#fff" strokeWidth={2} />
      ) : null}
      <SvgText x={PAD.l} y={H - 8} fill="#5C6B7A" fontSize={10}>
        {series.xAxisLabel}
      </SvgText>
      <SvgText x={6} y={PAD.t + 16} fill="#5C6B7A" fontSize={10}>
        {series.unit}
      </SvgText>
    </Svg>
  );
}
