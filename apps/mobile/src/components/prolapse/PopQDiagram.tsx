import { StyleSheet, Text } from "react-native";
import Svg, { Circle, Ellipse, Line, Text as SvgText } from "react-native-svg";

import type { PopQInput, PopQPointKey } from "@repo/medical-calculations/popq";

const HYMEN_Y = 200;
const PX_PER_CM = 11;
const POSITIONS: Record<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D", { x: number }> = {
  Aa: { x: 88 },
  Ba: { x: 108 },
  C: { x: 150 },
  D: { x: 168 },
  Ap: { x: 88 },
  Bp: { x: 108 },
};

function yForCm(cm: number | undefined): number {
  if (cm === undefined) return HYMEN_Y;
  return HYMEN_Y + cm * PX_PER_CM;
}

type Props = {
  input: PopQInput;
  uterusPresent: boolean;
  showNormal: boolean;
  normalInput: PopQInput;
  showLabels: boolean;
  leadingPoint?: PopQPointKey | null;
  normalTitle: string;
  patientTitle: string;
  axisHint: string;
  disclaimer: string;
};

function PointDot({
  label,
  cm,
  x,
  highlight,
  showLabel,
}: {
  label: string;
  cm?: number;
  x: number;
  highlight?: boolean;
  showLabel: boolean;
}) {
  if (cm === undefined) return null;
  const y = yForCm(cm);
  return (
    <>
      <Circle
        cx={x}
        cy={y}
        r={highlight ? 9 : 7}
        fill={highlight ? "#e11d48" : "#6d28d9"}
        stroke="#fff"
        strokeWidth={2}
      />
      {showLabel ? (
        <SvgText x={x} y={y - 12} textAnchor="middle" fill="#1e293b" fontSize={10} fontWeight="700">
          {`${label} (${cm})`}
        </SvgText>
      ) : null}
    </>
  );
}

export default function PopQDiagram({
  input,
  uterusPresent,
  showNormal,
  normalInput,
  showLabels,
  leadingPoint,
  normalTitle,
  patientTitle,
  axisHint,
  disclaimer,
}: Props) {
  const display = showNormal ? normalInput : input;
  const wallKeys: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = uterusPresent
    ? ["Aa", "Ba", "C", "D", "Ap", "Bp"]
    : ["Aa", "Ba", "C", "Ap", "Bp"];

  return (
    <>
      <Svg width="100%" height={280} viewBox="0 0 300 280" accessibilityLabel="Схема POP-Q">
        <Ellipse cx={150} cy={120} rx={52} ry={88} fill="#ffe4e6" stroke="#fb7185" strokeWidth={3} />
        <Line x1={70} y1={HYMEN_Y} x2={230} y2={HYMEN_Y} stroke="#7c2d12" strokeWidth={2} strokeDasharray="4 2" />
        <SvgText x={235} y={HYMEN_Y + 4} fill="#78350f" fontSize={9} fontWeight="700">
          гимен 0
        </SvgText>
        <SvgText x={24} y={36} fill="#881337" fontSize={10} fontWeight="700">
          {showNormal ? normalTitle : patientTitle}
        </SvgText>
        <SvgText x={24} y={52} fill="#475569" fontSize={9}>
          {axisHint}
        </SvgText>

        {wallKeys.map((key) => (
          <PointDot
            key={key}
            label={key}
            cm={display[key]}
            x={POSITIONS[key].x}
            highlight={!showNormal && leadingPoint === key}
            showLabel={showLabels}
          />
        ))}

        {display.GH !== undefined ? (
          <Line x1={58} y1={HYMEN_Y} x2={58} y2={HYMEN_Y + display.GH * PX_PER_CM} stroke="#2563eb" strokeWidth={2} />
        ) : null}
        {display.PB !== undefined ? (
          <Line
            x1={242}
            y1={HYMEN_Y}
            x2={242}
            y2={HYMEN_Y + display.PB * PX_PER_CM}
            stroke="#7c3aed"
            strokeWidth={2}
          />
        ) : null}
      </Svg>
      <Text style={styles.disclaimer}>{disclaimer}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    textAlign: "center",
    fontSize: 10,
    color: "#64748b",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
