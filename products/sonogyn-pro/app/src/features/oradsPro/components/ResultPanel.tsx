import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OradsResult } from "../types";

type Props = {
  result: OradsResult;
  aiText: string;
  onAskAI: () => void;
};

function colorsForCategory(category: number): { border: string; text: string; bg: string } {
  if (category <= 2) return { border: "#10B981", text: "#047857", bg: "#ECFDF5" };
  if (category === 3) return { border: "#F59E0B", text: "#B45309", bg: "#FFFBEB" };
  if (category === 4) return { border: "#EA580C", text: "#C2410C", bg: "#FFF7ED" };
  return { border: "#DC2626", text: "#B91C1C", bg: "#FEF2F2" };
}

export default function ResultPanel({ result, aiText, onAskAI }: Props) {
  const c = colorsForCategory(result.category);
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, borderTopColor: c.border }]}>
      <Text style={styles.title}>O-RADS {result.category}</Text>
      <Text style={[styles.risk, { color: c.text }]}>{result.riskText}</Text>
      <Text style={styles.rationale}>• {result.rationale}</Text>
      <Text style={styles.rec}>Рекомендация: {result.recommendation}</Text>
      {result.volumeMl != null ? <Text style={styles.rec}>Объем: {result.volumeMl} мл</Text> : null}
      {result.warning ? <Text style={styles.warning}>{result.warning}</Text> : null}

      <Pressable style={styles.aiButton} onPress={onAskAI}>
        <Text style={styles.aiButtonText}>Мнение AI (Beta)</Text>
      </Pressable>
      <Text style={styles.aiText}>{aiText}</Text>
      <Text style={styles.disclaimer}>AI является вспомогательным инструментом и не ставит диагноз.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  title: { fontSize: 30, fontWeight: "900", color: "#0f172a" },
  risk: { fontSize: 17, fontWeight: "800" },
  rationale: { color: "#334155", fontSize: 13 },
  rec: { color: "#334155", fontSize: 13 },
  warning: { color: "#b91c1c", fontSize: 12, fontWeight: "700" },
  aiButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    paddingVertical: 10,
  },
  aiButtonText: { color: "#fff", fontWeight: "800" },
  aiText: { marginTop: 6, color: "#334155", fontSize: 13 },
  disclaimer: { marginTop: 4, color: "#64748B", fontSize: 11 },
});
