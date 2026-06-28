import { StyleSheet, Text, View } from "react-native";

import type { MedvedevBiometryAssessment } from "../logic/medvedevBiometry";
import type { MedvedevDopplerAssessment } from "../logic/medvedevDoppler";
import type { MedvedevMarkerAssessment } from "../logic/medvedevFirstTrimester";
import type { MedvedevPlacentaAfiAssessment } from "../logic/medvedevPlacentaAfi";
import { getTeachForMarker, teachHintForAlert } from "../logic/medvedevTeaching";

type Row = {
  key: string;
  label: string;
  summary: string;
  percentile?: number;
  flag: string;
};

function mapRows(
  markers?: MedvedevMarkerAssessment[],
  biometry?: MedvedevBiometryAssessment[],
  doppler?: MedvedevDopplerAssessment[],
  placentaAfi?: MedvedevPlacentaAfiAssessment[],
): Row[] {
  return [
    ...(markers ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(biometry ?? []).map((m) => ({
      key: String(m.marker),
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(placentaAfi ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(doppler ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
  ];
}

function flagStyle(flag: string) {
  if (flag === "high") return styles.rowHigh;
  if (flag === "low") return styles.rowLow;
  if (flag === "normal") return styles.rowOk;
  return styles.rowMuted;
}

export function MedvedevPanel({
  title,
  markers,
  biometry,
  doppler,
  placentaAfi,
  teachMode = true,
}: {
  title: string;
  markers?: MedvedevMarkerAssessment[];
  biometry?: MedvedevBiometryAssessment[];
  doppler?: MedvedevDopplerAssessment[];
  placentaAfi?: MedvedevPlacentaAfiAssessment[];
  teachMode?: boolean;
}) {
  const rows = mapRows(markers, biometry, doppler, placentaAfi);
  if (rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row) => {
        const teach = teachMode ? getTeachForMarker(row.key) : null;
        return (
          <View key={row.key} style={[styles.row, flagStyle(row.flag)]}>
            <Text style={styles.rowLabel}>
              {row.label}
              {row.percentile != null ? ` · ~${row.percentile}-й перц.` : ""}
            </Text>
            <Text style={styles.rowSummary}>{row.summary}</Text>
            {teach ? (
              <View style={styles.teachBox}>
                <Text style={styles.teachTitle}>📚 Как мерить</Text>
                <Text style={styles.teachText}>{teach.howToMeasure}</Text>
                <Text style={styles.teachTitle}>Клиника</Text>
                <Text style={styles.teachText}>{teach.clinicalMeaning}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function AlertWithTeach({ alert }: { alert: string }) {
  const hint = teachHintForAlert(alert);
  return (
    <View style={styles.alertWrap}>
      <Text style={styles.alertText}>{alert}</Text>
      {hint ? <Text style={styles.teachHint}>📚 {hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  title: { fontSize: 13, fontWeight: "700", color: "#312e81", marginBottom: 8 },
  row: { borderRadius: 8, padding: 8, marginBottom: 6 },
  rowOk: { backgroundColor: "#ecfdf5" },
  rowLow: { backgroundColor: "#fffbeb" },
  rowHigh: { backgroundColor: "#fef2f2" },
  rowMuted: { backgroundColor: "#f1f5f9" },
  rowLabel: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  rowSummary: { fontSize: 11, color: "#475569", marginTop: 2 },
  teachBox: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  teachTitle: { fontSize: 10, fontWeight: "700", color: "#92400e", marginTop: 4 },
  teachText: { fontSize: 10, color: "#64748b", lineHeight: 14 },
  alertWrap: { marginBottom: 6 },
  alertText: { fontSize: 13, color: "#b45309", fontWeight: "600" },
  teachHint: { fontSize: 11, color: "#64748b", marginTop: 2, fontStyle: "italic" },
});
