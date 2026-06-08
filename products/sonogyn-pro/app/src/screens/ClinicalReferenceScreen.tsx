import {
  CLINICAL_REFERENCE,
  getTopic,
  searchReference,
  type ClinicalTopic,
} from "@repo/clinical-reference";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { branding } from "../config/branding";
import type { RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type ClinicalReferenceScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ClinicalReference"
>;

export default function ClinicalReferenceScreen({ navigation }: ClinicalReferenceScreenProps) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(CLINICAL_REFERENCE.topics[0]?.id ?? "");

  const active = useMemo(
    () => getTopic(CLINICAL_REFERENCE, activeId) ?? CLINICAL_REFERENCE.topics[0],
    [activeId],
  );

  const filtered = useMemo(() => {
    if (query.trim().length >= 2) {
      return searchReference(CLINICAL_REFERENCE, query).map(
        (h) => getTopic(CLINICAL_REFERENCE, h.topicId)!,
      );
    }
    return CLINICAL_REFERENCE.topics;
  }, [query]);

  const bySection = useMemo(() => {
    const map = new Map<string, ClinicalTopic[]>();
    for (const t of filtered) {
      const list = map.get(t.section) ?? [];
      list.push(t);
      map.set(t.section, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.title}>{CLINICAL_REFERENCE.title}</Text>
        <TextInput
          style={styles.search}
          placeholder="Поиск…"
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {active ? (
          <View style={styles.card}>
            <Text style={styles.section}>{active.section}</Text>
            <Text style={styles.chapterTitle}>{active.title}</Text>
            <Text style={styles.content}>{active.summary}</Text>
            <Text style={styles.methodLabel}>Методика</Text>
            <Text style={styles.content}>{active.methodology}</Text>
          </View>
        ) : null}
        {bySection.map(([section, topics]) => (
          <View key={section} style={styles.block}>
            <Text style={styles.blockTitle}>{section}</Text>
            {topics.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.row, active?.id === t.id && styles.rowActive]}
                onPress={() => setActiveId(t.id)}
              >
                <Text style={styles.rowTitle}>{t.title}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingBottom: 8 },
  back: { fontSize: 16, color: "#6D28D9", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: branding.colors.text, marginBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: branding.colors.text,
  },
  body: { padding: theme.spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    padding: 16,
    marginBottom: 20,
    ...theme.shadow.card,
  },
  section: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  chapterTitle: { fontSize: 20, fontWeight: "700", color: branding.colors.text, marginTop: 4 },
  methodLabel: { fontSize: 13, fontWeight: "700", marginTop: 12, color: branding.colors.text },
  content: { fontSize: 14, lineHeight: 21, color: branding.colors.textSecondary, marginTop: 6 },
  block: { marginBottom: 16 },
  blockTitle: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 6 },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 6,
  },
  rowActive: { borderColor: "#c4b5fd", backgroundColor: "#f5f3ff" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: branding.colors.text },
});
