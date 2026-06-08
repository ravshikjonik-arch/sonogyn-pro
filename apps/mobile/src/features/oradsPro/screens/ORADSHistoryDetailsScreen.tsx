import { useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../../../navigation/AppStack";
import { buildReportText } from "../logic/oradsCalculator";
import { useOradsCaseHistory } from "./useOradsCaseHistory";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSHistoryDetails">;

export default function ORADSHistoryDetailsScreen({ route, navigation }: Props) {
  const { rows } = useOradsCaseHistory();
  const item = useMemo(() => rows.find((x) => x.id === route.params.caseId), [rows, route.params.caseId]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Назад</Text>
          </Pressable>
          <Text style={styles.title}>Кейс не найден</Text>
          <View />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>Детали кейса</Text>
        <Pressable onPress={() => navigation.navigate("ORADSPro", { prefill: item.input })}>
          <Text style={styles.template}>Как шаблон</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cat}>O-RADS {item.result.category}</Text>
          <Text style={styles.time}>{new Date(item.at).toLocaleString()}</Text>
          <Text style={styles.line}>Риск: {item.result.riskText}</Text>
          <Text style={styles.line}>Обоснование: {item.result.rationale}</Text>
          <Text style={styles.line}>Рекомендация: {item.result.recommendation}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.report}>{buildReportText(item.input, item.result)}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("ORADSPro", { prefill: item.input })}>
            <Text style={styles.btnGhostText}>Использовать как шаблон</Text>
          </Pressable>
          <Pressable style={styles.btnPrimary} onPress={() => navigation.navigate("ORADSPro", { prefill: item.input })}>
            <Text style={styles.btnPrimaryText}>Дублировать как новый кейс</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#2563EB", fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  template: { color: "#ea580c", fontWeight: "700" },
  content: { padding: 14, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  cat: { color: "#0f172a", fontWeight: "800", fontSize: 16 },
  time: { color: "#64748B", fontSize: 12, marginBottom: 4 },
  line: { color: "#334155", fontSize: 13 },
  report: { color: "#334155", fontSize: 13, lineHeight: 20 },
  actions: { gap: 8 },
  btnGhost: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  btnGhostText: { color: "#334155", fontWeight: "700" },
  btnPrimary: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#2563EB",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
});
