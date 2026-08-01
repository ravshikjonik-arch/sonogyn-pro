import {
  IOTA_BENIGN_DESCRIPTORS,
  IOTA_MALIGNANT_DESCRIPTORS,
  ORADS_US_VERSION,
  type AdnexTriangulation,
} from "@repo/adnex-education";
import { Pressable, StyleSheet, Text, View } from "react-native";

const AGREEMENT_RU = {
  full: "Согласовано",
  partial: "Уточнить",
  conflict: "Расхождение",
} as const;

const VERDICT_RU = {
  benign: "доброкачественное",
  malignant: "подозрение на ЗНО",
  indeterminate: "неопределённо",
} as const;

function descriptorLabel(code: string, kind: "benign" | "malignant") {
  const list = kind === "benign" ? IOTA_BENIGN_DESCRIPTORS : IOTA_MALIGNANT_DESCRIPTORS;
  const d = list.find((x) => x.code === code);
  return d ? `${d.code}: ${d.labelRu}` : code;
}

type Props = {
  triangulation: AdnexTriangulation;
  onBuildReport: () => void;
};

export default function OradsWizardIotaPanel({ triangulation: tri, onBuildReport }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{ORADS_US_VERSION} · ACR / IOTA</Text>
      <Text style={styles.title}>O-RADS US × IOTA Simple Rules</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{AGREEMENT_RU[tri.agreement]}</Text>
      </View>
      <Text style={styles.headline}>{tri.headline}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>O-RADS US</Text>
        <Text style={styles.oradsNum}>{tri.oradsCategory}</Text>
        {tri.suggestedOradsNote ? <Text style={styles.note}>{tri.suggestedOradsNote}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>IOTA Simple Rules</Text>
        <Text style={styles.verdict}>{VERDICT_RU[tri.iotaVerdict]}</Text>
        {tri.iotaBenign.map((c) => (
          <Text key={c} style={styles.benign}>
            {descriptorLabel(c, "benign")}
          </Text>
        ))}
        {tri.iotaMalignant.map((c) => (
          <Text key={c} style={styles.malignant}>
            {descriptorLabel(c, "malignant")}
          </Text>
        ))}
        {!tri.iotaBenign.length && !tri.iotaMalignant.length ? (
          <Text style={styles.muted}>Признаки B/M не выведены из пути мастера — уточните в Pro.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Тактика</Text>
        <Text style={styles.body}>{tri.managementRu}</Text>
      </View>

      <Text style={styles.disclaimer}>
        Справочная информация (CDS). Не диагноз; интерпретация — лечащий специалист.
      </Text>

      <Pressable style={styles.primary} onPress={onBuildReport}>
        <Text style={styles.primaryText}>Структурированный протокол (с IOTA)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  kicker: { fontSize: 10, fontWeight: "800", color: "#0369a1", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#047857" },
  headline: { fontSize: 13, color: "#334155", lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
    gap: 4,
  },
  cardLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase" },
  oradsNum: { fontSize: 28, fontWeight: "900", color: "#1d4ed8" },
  note: { fontSize: 12, color: "#b45309", fontWeight: "600" },
  verdict: { fontSize: 14, fontWeight: "800", color: "#5b21b6" },
  benign: { fontSize: 12, color: "#047857", lineHeight: 17 },
  malignant: { fontSize: 12, color: "#b91c1c", lineHeight: 17 },
  muted: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  body: { fontSize: 13, color: "#334155", lineHeight: 19 },
  disclaimer: { fontSize: 11, color: "#64748b", lineHeight: 15 },
  primary: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
