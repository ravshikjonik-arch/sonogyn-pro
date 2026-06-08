import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../../../navigation/AppStack";
import { useMemo, useState } from "react";
import SelectChip from "../components/SelectChip";
import { useOradsCaseHistory } from "./useOradsCaseHistory";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSHistory">;

export default function ORADSHistoryScreen({ navigation }: Props) {
  const { rows, reload } = useOradsCaseHistory();
  const [filterCat, setFilterCat] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [last7d, setLast7d] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "risk">("new");
  const visible = useMemo(() => {
    const now = Date.now();
    const filtered = rows.filter((r) => {
      if (filterCat !== 0 && r.result.category !== filterCat) return false;
      if (highRiskOnly && r.result.category < 4) return false;
      if (criticalOnly) {
        const critical =
          r.result.category === 5 || (!!r.input.ascites && !!r.input.peritonealNodules) || (!!r.input.ascites && r.result.category >= 4);
        if (!critical) return false;
      }
      if (last7d && now - r.at > 7 * 24 * 60 * 60 * 1000) return false;
      return true;
    });
    if (sortBy === "risk") {
      return [...filtered].sort((a, b) => b.result.category - a.result.category || b.at - a.at);
    }
    return [...filtered].sort((a, b) => b.at - a.at);
  }, [rows, filterCat, last7d, highRiskOnly, criticalOnly, sortBy]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>История O-RADS</Text>
        <Pressable onPress={reload}>
          <Text style={styles.reload}>Обновить</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filters}>
          <View style={styles.rowWrap}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <SelectChip
                key={n}
                label={n === 0 ? "Все" : `O-RADS ${n}`}
                selected={filterCat === n}
                onPress={() => setFilterCat(n as 0 | 1 | 2 | 3 | 4 | 5)}
              />
            ))}
          </View>
          <View style={styles.rowWrap}>
            <SelectChip label="Последние 7 дней" selected={last7d} onPress={() => setLast7d((p) => !p)} />
            <SelectChip label="Только O-RADS 4-5" selected={highRiskOnly} onPress={() => setHighRiskOnly((p) => !p)} />
            <SelectChip label="Критичные" selected={criticalOnly} onPress={() => setCriticalOnly((p) => !p)} />
          </View>
          <View style={styles.rowWrap}>
            <SelectChip label="Сорт: новые" selected={sortBy === "new"} onPress={() => setSortBy("new")} />
            <SelectChip label="Сорт: риск" selected={sortBy === "risk"} onPress={() => setSortBy("risk")} />
          </View>
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Пока нет сохраненных кейсов.</Text>
          </View>
        ) : (
          visible.map((r) => (
            <Pressable key={r.id} style={styles.card} onPress={() => navigation.navigate("ORADSHistoryDetails", { caseId: r.id })}>
              <Text style={styles.cat}>O-RADS {r.result.category}</Text>
              <Text style={styles.time}>{new Date(r.at).toLocaleString()}</Text>
              <Text style={styles.line}>Риск: {r.result.riskText}</Text>
              <Text style={styles.line}>Обоснование: {r.result.rationale}</Text>
              <Text style={styles.line}>Рекомендация: {r.result.recommendation}</Text>
            </Pressable>
          ))
        )}
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
  reload: { color: "#ea580c", fontWeight: "700" },
  content: { padding: 14, gap: 10, paddingBottom: 24 },
  filters: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empty: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
  },
  emptyText: { color: "#64748B" },
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
});
