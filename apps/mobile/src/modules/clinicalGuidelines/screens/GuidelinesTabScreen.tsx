import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRODUCT } from "../../../config/product";
import type { MainTabParamList, RootStackParamList } from "../../../navigation/paramLists";
import { theme } from "../../../theme";
import {
  CLINICAL_GUIDELINES,
  FILTER_CHIPS,
  SHELF_LABELS,
  SHELF_ORDER,
  searchGuidelines,
  groupGuidelinesByShelf,
  SPECIALTY_LABELS,
} from "../guidelinesManifest";
import type { GuidelineFilter } from "../types";

export type GuidelinesTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "GuidelinesTab">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function GuidelinesTabScreen({ navigation }: GuidelinesTabScreenProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GuidelineFilter>("all");

  const filtered = useMemo(
    () => searchGuidelines(CLINICAL_GUIDELINES, query, { specialty: filter }),
    [query, filter],
  );

  const grouped = useMemo(
    () => groupGuidelinesByShelf(filtered, SHELF_ORDER),
    [filtered],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.product}>{PRODUCT.shortName}</Text>
        <Text style={styles.title}>КР и приказы</Text>
        <Text style={styles.sub}>Отдельные полки · МЗ РФ · ДЗМ · протоколы</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Поиск по названию, тегам…"
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Поиск клинических рекомендаций"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTER_CHIPS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setFilter(c.id)}
            style={[styles.chip, filter === c.id && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === c.id }}
          >
            <Text style={[styles.chipText, filter === c.id && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Ничего не найдено</Text>
            <Text style={styles.emptyBody}>Измените поиск или фильтр специальности.</Text>
          </View>
        ) : (
          grouped.map(({ shelf, items }) => (
            <View key={shelf} style={styles.shelfBlock}>
              <Text style={styles.shelfTitle}>{SHELF_LABELS[shelf]}</Text>
              {items.map((g) => (
                <Pressable
                  key={g.id}
                  style={styles.row}
                  onPress={() => navigation.navigate("ClinicalGuidelineDetail", { guidelineId: g.id })}
                  accessibilityRole="button"
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {g.title}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {SPECIALTY_LABELS[g.specialty]} · {g.year}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {g.summary}
                    </Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  product: { fontSize: 11, fontWeight: "800", color: "#6D28D9", letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginTop: 4 },
  sub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#EDE9FE", borderColor: "#7C3AED" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#5B21B6" },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  shelfBlock: { marginTop: 8, gap: 8 },
  shelfTitle: { fontSize: 13, fontWeight: "800", color: "#475569", marginTop: 8, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  rowMain: { flex: 1, paddingRight: 8 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text, lineHeight: 20 },
  rowMeta: { fontSize: 11, fontWeight: "600", color: "#6D28D9", marginTop: 4 },
  rowSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  chev: { fontSize: 22, color: "#94A3B8", fontWeight: "300" },
  emptyBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  emptyBody: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
});
