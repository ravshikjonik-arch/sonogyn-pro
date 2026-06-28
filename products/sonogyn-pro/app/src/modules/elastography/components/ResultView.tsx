import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import i18n from "../../../i18n";
import { RISK_COLORS } from "../constants";
import { exportElastographyPdf } from "../utils/exportPdf";
import type { ElastographyCalculatorResult, ElastographyHistoryEntry, RiskCategory } from "../types";

type Props = {
  t: (key: string) => string;
  result: ElastographyCalculatorResult;
  currentEntry: ElastographyHistoryEntry | null;
  scaleMin?: number;
  scaleMax?: number;
  onBack: () => void;
  onSave: () => void;
};

function riskLabel(t: (k: string) => string, cat: RiskCategory): string {
  if (cat === "low") return t("elasto_risk_low");
  if (cat === "high") return t("elasto_risk_high");
  return t("elasto_risk_intermediate");
}

function riskIcon(cat: RiskCategory): keyof typeof Ionicons.glyphMap {
  if (cat === "low") return "checkmark-circle";
  if (cat === "high") return "warning";
  return "alert-circle";
}

/** Градиентная шкала (сегменты) + маркер значения */
function RiskScale({
  value,
  min,
  max,
  color,
}: {
  value: number;
  min: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  return (
    <View style={styles.scaleWrap} accessibilityRole="adjustable" accessibilityLabel={`Value ${value}`}>
      <View style={styles.scaleTrack}>
        <View style={[styles.seg, { backgroundColor: RISK_COLORS.low, flex: 1 }]} />
        <View style={[styles.seg, { backgroundColor: RISK_COLORS.intermediate, flex: 1 }]} />
        <View style={[styles.seg, { backgroundColor: RISK_COLORS.high, flex: 1 }]} />
      </View>
      <View style={[styles.marker, { left: `${pct * 100}%`, borderColor: color }]}>
        <View style={[styles.markerDot, { backgroundColor: color }]} />
      </View>
      <Text style={styles.scaleValue}>{value.toFixed(2)}</Text>
    </View>
  );
}

export default function ResultView({
  t,
  result,
  currentEntry,
  scaleMin = 0,
  scaleMax = 1,
  onBack,
  onSave,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [fade]);

  const handleExportPdf = async () => {
    if (!currentEntry) return;
    await exportElastographyPdf(currentEntry);
  };

  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]}>
      <View style={[styles.statusRow, { borderColor: result.colorHex }]}>
        <Ionicons name={riskIcon(result.riskCategory)} size={32} color={result.colorHex} />
        <Text style={[styles.statusText, { color: result.colorHex }]}>{riskLabel(t, result.riskCategory)}</Text>
      </View>

      <RiskScale value={result.value} min={scaleMin} max={scaleMax} color={result.colorHex} />

      <Text style={[styles.conclusion, isDark && styles.conclusionDark]}>{result.conclusion}</Text>
      <Text style={styles.recommendation}>{result.recommendation}</Text>

      {result.integrationHints?.biradsHint ? (
        <Text style={styles.integration}>BI-RADS: {result.integrationHints.biradsHint}</Text>
      ) : null}
      {result.integrationHints?.oradsHint ? (
        <Text style={styles.integration}>O-RADS: {result.integrationHints.oradsHint}</Text>
      ) : null}

      <Text style={styles.disclaimer}>{t("elasto_disclaimer")}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={onSave} accessibilityRole="button">
          <Text style={styles.secondaryText}>{t("elasto_save_history")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleExportPdf} accessibilityRole="button">
          <Text style={styles.secondaryText}>{t("elasto_share_pdf")}</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onBack} accessibilityRole="button">
          <Text style={styles.primaryText}>{i18n.t("back")}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  statusText: { fontSize: 18, fontWeight: "800" },
  scaleWrap: { paddingVertical: 8 },
  scaleTrack: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden" },
  seg: { height: "100%" },
  marker: {
    position: "absolute",
    top: 0,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: { width: 8, height: 8, borderRadius: 4 },
  scaleValue: { marginTop: 8, fontSize: 14, fontWeight: "700", color: "#475569", textAlign: "center" },
  conclusion: { fontSize: 17, fontWeight: "700", color: "#0F2744", lineHeight: 24 },
  conclusionDark: { color: "#f1f5f9" },
  recommendation: { fontSize: 14, color: "#475569", lineHeight: 20 },
  integration: { fontSize: 13, fontWeight: "600", color: "#6D28D9" },
  disclaimer: { fontSize: 11, color: "#94a3b8", lineHeight: 16, fontStyle: "italic" },
  actions: { gap: 10, marginTop: 8 },
  primaryBtn: {
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#334155", fontWeight: "600" },
});
