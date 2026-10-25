import { StyleSheet, Text, View } from "react-native";
import type { OradsUs2022Result } from "@repo/orads-us/pro";
import { cdssOradsCategoryBandLabel, CDSS_SHORT_DISCLAIMER } from "@repo/clinical-tools";

type Props = {
  result: OradsUs2022Result;
  testID?: string;
};

function colorsForCategory(category: number | null): { accent: string; text: string; bg: string } {
  if (category === null) return { accent: "#f59e0b", text: "#b45309", bg: "#fffbeb" };
  if (category <= 1) return { accent: "#0ea5e9", text: "#0369a1", bg: "#f0f9ff" };
  if (category === 2) return { accent: "#10B981", text: "#047857", bg: "#ECFDF5" };
  if (category === 3) return { accent: "#F59E0B", text: "#B45309", bg: "#FFFBEB" };
  if (category === 4) return { accent: "#EA580C", text: "#C2410C", bg: "#FFF7ED" };
  return { accent: "#DC2626", text: "#B91C1C", bg: "#FEF2F2" };
}

export default function OradsUnifiedResultPanel({ result, testID }: Props) {
  const c = colorsForCategory(result.category);
  return (
    <View
      style={[styles.wrap, { backgroundColor: c.bg, borderLeftColor: c.accent }]}
      testID={testID}
      accessibilityLiveRegion="polite"
    >
      {result.category === null ? (
        <>
          <Text style={styles.label}>Категория</Text>
          <Text style={styles.pendingTitle}>{result.title}</Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>O-RADS US v2022</Text>
          <Text style={styles.categoryNum} accessibilityLabel={`O-RADS ${result.category}`}>
            {result.category}
          </Text>
          <Text style={styles.bandLabel}>{cdssOradsCategoryBandLabel(result.category)}</Text>
          <Text style={[styles.risk, { color: c.text }]}>
            ROM: {result.risk}
          </Text>
        </>
      )}
      <View style={styles.divider} />
      <Text style={styles.body}>{result.rationale}</Text>
      <Text style={styles.mgmt}>{result.management}</Text>
      {result.missing.length ? (
        <View style={styles.missingWrap}>
          {result.missing.map((m) => (
            <Text key={m} style={styles.missing}>
              — {m}
            </Text>
          ))}
        </View>
      ) : null}
      {result.warning ? <Text style={styles.warning}>{result.warning}</Text> : null}
      <Text style={styles.disclaimer} accessibilityRole="text">
        {CDSS_SHORT_DISCLAIMER}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  label: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  categoryNum: { fontSize: 48, fontWeight: "600", color: "#0f172a", letterSpacing: -1 },
  pendingTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a", lineHeight: 24 },
  bandLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginTop: 6, lineHeight: 20 },
  risk: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  divider: { height: 1, backgroundColor: "rgba(148,163,184,0.45)", marginVertical: 10 },
  body: { color: "#334155", fontSize: 14, lineHeight: 20 },
  mgmt: { color: "#0f172a", fontSize: 14, fontWeight: "600", lineHeight: 20, marginTop: 6 },
  missingWrap: { marginTop: 8, gap: 2 },
  missing: { fontSize: 12, color: "#64748b" },
  warning: {
    marginTop: 8,
    fontSize: 12,
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 8,
  },
  disclaimer: { marginTop: 10, fontSize: 11, color: "#64748b", lineHeight: 16 },
});
