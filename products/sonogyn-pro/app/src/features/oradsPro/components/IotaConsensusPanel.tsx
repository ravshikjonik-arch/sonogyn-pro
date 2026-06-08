import { StyleSheet, Text, View } from "react-native";
import type { IotaConsensusResult } from "../consensus/iotaConsensus2026";

type Props = {
  consensus: IotaConsensusResult;
};

export default function IotaConsensusPanel({ consensus }: Props) {
  const ready = consensus.readiness === "complete";
  return (
    <View style={[styles.card, ready ? styles.cardReady : styles.cardIncomplete]}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Консенсус IOTA 2026</Text>
        <Text style={[styles.status, ready ? styles.statusReady : styles.statusIncomplete]}>
          {ready ? "заполнено" : "неполно"}
        </Text>
      </View>
      <Text style={styles.title}>{consensus.harmonizedCategory}</Text>
      <Text style={styles.version}>{consensus.versionLabel}</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Модифицированный доброкачественный дескриптор</Text>
        <Text style={styles.body}>
          {consensus.modifiedBenignDescriptor.label}. {consensus.modifiedBenignDescriptor.note}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Двухэтапная стратегия</Text>
        <Text style={styles.body}>{consensus.twoStepStrategy.route}</Text>
      </View>

      <View style={styles.vars}>
        {consensus.adnexVariables.map((item) => (
          <View key={item.key} style={styles.varRow}>
            <Text style={styles.varLabel}>{item.label}</Text>
            <Text style={[styles.varValue, !item.complete && styles.varMissing]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.terms}>
        <Text style={styles.blockTitle}>Обновлённые термины IOTA по введённым данным</Text>
        {consensus.updatedTerms.map((item) => (
          <View key={item.term} style={styles.termBox}>
            <Text style={styles.termTitle}>{item.term}: {item.value}</Text>
            <Text style={styles.termDefinition}>{item.definition}</Text>
          </View>
        ))}
      </View>

      {consensus.missingFields.length ? (
        <Text style={styles.missing}>Заполнить для полной IOTA-структуры: {consensus.missingFields.join(", ")}</Text>
      ) : null}
      <Text style={styles.note}>{consensus.clinicalNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    backgroundColor: "#ffffff",
  },
  cardReady: { borderColor: "#99f6e4" },
  cardIncomplete: { borderColor: "#fde68a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  kicker: { color: "#6D28D9", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "900", overflow: "hidden" },
  statusReady: { color: "#047857", backgroundColor: "#d1fae5" },
  statusIncomplete: { color: "#92400e", backgroundColor: "#fef3c7" },
  title: { color: "#0f172a", fontSize: 19, fontWeight: "900" },
  version: { color: "#64748b", fontSize: 12, lineHeight: 17 },
  block: { gap: 3 },
  blockTitle: { color: "#334155", fontSize: 13, fontWeight: "900" },
  body: { color: "#475569", fontSize: 13, lineHeight: 19 },
  vars: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, gap: 6 },
  varRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  varLabel: { flex: 1, color: "#475569", fontSize: 12, fontWeight: "700" },
  varValue: { flex: 1, color: "#0f172a", fontSize: 12, textAlign: "right" },
  varMissing: { color: "#b45309", fontWeight: "800" },
  terms: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, gap: 7 },
  termBox: { borderRadius: 10, backgroundColor: "#f8fafc", padding: 9, gap: 3 },
  termTitle: { color: "#0f172a", fontSize: 12, fontWeight: "900" },
  termDefinition: { color: "#475569", fontSize: 11, lineHeight: 16 },
  missing: { color: "#92400e", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  note: { color: "#64748b", fontSize: 11, lineHeight: 16 },
});
