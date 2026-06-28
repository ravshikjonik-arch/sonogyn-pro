import { StyleSheet, Text, View } from "react-native";

import { formatMeasurementDecimal } from "@repo/medical-calculations";
import type { CategoricalResult, PercentileResult } from "@repo/fmf";
import { FMF_ENGINE_DISCLAIMER } from "@repo/fmf";

function flagStyle(flag?: PercentileResult["flag"]) {
  if (flag === "critical_high" || flag === "high") return styles.rowHigh;
  if (flag === "critical_low" || flag === "low") return styles.rowLow;
  if (flag === "normal") return styles.rowOk;
  return styles.rowMuted;
}

function fmt(n: number | undefined): string {
  return n != null && Number.isFinite(n) ? formatMeasurementDecimal(n) : "—";
}

export function FmfPercentilePanel({
  measurements,
  categorical = [],
}: {
  measurements: PercentileResult[];
  categorical?: CategoricalResult[];
}) {
  if (!measurements.length && !categorical.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>FMF Percentile Engine · I скрининг</Text>
      <Text style={styles.disclaimer}>{FMF_ENGINE_DISCLAIMER}</Text>

      {measurements.map((m) => (
        <View key={m.parameterId} style={[styles.row, flagStyle(m.flag)]}>
          <Text style={styles.label}>{m.labelRu}</Text>
          <Text style={styles.metrics}>
            {fmt(m.value)} → exp {fmt(m.expected)} · SD {fmt(m.sd)} · P~{fmt(m.percentile)} · Z {fmt(m.zScore)} · MoM{" "}
            {fmt(m.mom)}
          </Text>
          {m.band ? (
            <Text style={styles.band}>
              P3 {m.band.p3} · P50 {m.band.p50} · P97 {m.band.p97}
            </Text>
          ) : null}
          <Text style={styles.interp}>{m.interpretation}</Text>
        </View>
      ))}

      {categorical.map((c) => (
        <View key={c.parameterId} style={styles.catRow}>
          <Text style={styles.label}>
            {c.labelRu}
            {c.likelihoodRatio != null ? ` · LR ${c.likelihoodRatio}` : ""}
          </Text>
          <Text style={styles.interp}>{c.interpretation}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
  },
  title: { fontSize: 13, fontWeight: "700", color: "#312e81" },
  disclaimer: { marginTop: 4, fontSize: 10, color: "#64748b", lineHeight: 14 },
  row: { marginTop: 8, padding: 8, borderRadius: 8 },
  rowOk: { backgroundColor: "#ecfdf5" },
  rowHigh: { backgroundColor: "#fee2e2" },
  rowLow: { backgroundColor: "#fef3c7" },
  rowMuted: { backgroundColor: "#f8fafc" },
  label: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  metrics: { marginTop: 2, fontSize: 11, color: "#334155" },
  band: { marginTop: 2, fontSize: 10, color: "#6366f1" },
  interp: { marginTop: 4, fontSize: 11, color: "#475569", lineHeight: 15 },
  catRow: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});
