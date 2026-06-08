import { StyleSheet, Text, TextInput, View } from "react-native";
import type { POPQPointKey } from "../../gynecology/prolapseLogic";
import { computePOPQStage, parsePOPQFields } from "../../gynecology/prolapseLogic";
import { popqStageLabel } from "../../gynecology/prolapseStageLabel";
import i18n from "../../i18n";
import { theme } from "../../theme";

const FIELDS: POPQPointKey[] = ["Aa", "Ba", "Ap", "Bp", "C", "D", "GH", "PB", "TVL"];

type Props = {
  values: Record<POPQPointKey, string>;
  onChange: (k: POPQPointKey, v: string) => void;
};

function PopqPoint({ label, style }: { label: string; style: object }) {
  return (
    <View style={[styles.point, style]}>
      <Text style={styles.pointText}>{label}</Text>
    </View>
  );
}

function POPQSchema() {
  return (
    <View style={styles.schemaCard}>
      <Text style={styles.schemaTitle}>Схема точек POP-Q</Text>
      <Text style={styles.schemaSub}>0 см — уровень гимена. Значения выше гимена отрицательные, ниже/кнаружи — положительные.</Text>
      <View style={styles.schema}>
        <View style={styles.vaginalCanal} />
        <View style={styles.hymenLine} />
        <Text style={styles.hymenText}>гимен 0 см</Text>

        <Text style={[styles.wallLabel, styles.anteriorLabel]}>передняя стенка</Text>
        <Text style={[styles.wallLabel, styles.posteriorLabel]}>задняя стенка</Text>

        <PopqPoint label="Aa" style={styles.aa} />
        <PopqPoint label="Ba" style={styles.ba} />
        <PopqPoint label="C" style={styles.c} />
        <PopqPoint label="D" style={styles.d} />
        <PopqPoint label="Ap" style={styles.ap} />
        <PopqPoint label="Bp" style={styles.bp} />

        <View style={[styles.measureLine, styles.ghLine]} />
        <Text style={[styles.measureText, styles.ghText]}>GH</Text>
        <View style={[styles.measureLine, styles.pbLine]} />
        <Text style={[styles.measureText, styles.pbText]}>PB</Text>
        <View style={[styles.measureLine, styles.tvlLine]} />
        <Text style={[styles.measureText, styles.tvlText]}>TVL</Text>
      </View>
      <View style={styles.schemaLegend}>
        <Text style={styles.legendText}>Aa/Ba — передняя стенка</Text>
        <Text style={styles.legendText}>Ap/Bp — задняя стенка</Text>
        <Text style={styles.legendText}>C/D — верхушка/шейка и задний свод</Text>
        <Text style={styles.legendText}>GH/PB/TVL — щель, промежность, общая длина влагалища</Text>
      </View>
    </View>
  );
}

export default function POPQCalculator({ values, onChange }: Props) {
  const parsed = parsePOPQFields(values);
  const { maxPoint, stageKey } = computePOPQStage(parsed);
  const stageText = popqStageLabel(stageKey);
  const maxText = maxPoint == null ? "—" : String(maxPoint);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sub}>{i18n.t("prolapse_popq_subtitle")}</Text>
      <POPQSchema />
      <View style={styles.grid}>
        {FIELDS.map((key) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{key}</Text>
            <TextInput
              value={values[key]}
              onChangeText={(t) => onChange(key, t)}
              keyboardType="numbers-and-punctuation"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Text style={styles.unit}>{i18n.t("prolapse_cm")}</Text>
          </View>
        ))}
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{i18n.t("prolapse_popq_max_point")}</Text>
          <Text style={styles.metricValue}>{maxText}</Text>
        </View>
        <View style={[styles.metric, styles.metricWide]}>
          <Text style={styles.metricLabel}>{i18n.t("prolapse_popq_stage_label")}</Text>
          <Text style={styles.metricValueLg}>{stageText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  sub: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  schemaCard: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 8,
    ...theme.shadow.card,
  },
  schemaTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  schemaSub: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17 },
  schema: {
    height: 260,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    overflow: "hidden",
    position: "relative",
  },
  vaginalCanal: {
    position: "absolute",
    left: "22%",
    right: "22%",
    top: 34,
    bottom: 34,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: "#fb7185",
    backgroundColor: "#ffe4e6",
  },
  hymenLine: { position: "absolute", left: 18, right: 18, top: 184, height: 2, backgroundColor: "#7c2d12" },
  hymenText: { position: "absolute", right: 20, top: 164, color: "#7c2d12", fontSize: 11, fontWeight: "800" },
  wallLabel: { position: "absolute", color: "#9f1239", fontSize: 11, fontWeight: "900" },
  anteriorLabel: { top: 18, left: 22 },
  posteriorLabel: { bottom: 18, left: 22 },
  point: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#831843",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pointText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  aa: { left: "33%", top: 78 },
  ba: { left: "52%", top: 58 },
  c: { left: "67%", top: 108, backgroundColor: "#0f766e" },
  d: { left: "69%", top: 146, backgroundColor: "#0f766e" },
  ap: { left: "33%", top: 146 },
  bp: { left: "52%", top: 166 },
  measureLine: { position: "absolute", width: 2, backgroundColor: "#2563eb" },
  measureText: { position: "absolute", color: "#1d4ed8", fontSize: 11, fontWeight: "900" },
  ghLine: { left: "18%", top: 184, height: 42 },
  ghText: { left: "13%", top: 202 },
  pbLine: { right: "18%", top: 184, height: 42, backgroundColor: "#7c3aed" },
  pbText: { right: "12%", top: 202, color: "#6d28d9" },
  tvlLine: { left: "50%", top: 46, height: 138, backgroundColor: "#0891b2" },
  tvlText: { left: "53%", top: 94, color: "#0e7490" },
  schemaLegend: { gap: 3 },
  legendText: { color: "#475569", fontSize: 12, lineHeight: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  field: {
    width: "30%",
    flexGrow: 1,
    minWidth: "28%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    ...theme.shadow.card,
  },
  label: { fontSize: 13, fontWeight: "800", color: theme.colors.primary, marginBottom: 6 },
  input: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  unit: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  metrics: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  metric: {
    flex: 1,
    minWidth: "42%",
    backgroundColor: "#0f172a",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  metricWide: { minWidth: "90%" },
  metricLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  metricValue: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 4 },
  metricValueLg: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 4 },
});
