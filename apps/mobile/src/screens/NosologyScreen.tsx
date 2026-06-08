import { getSeedNosologies, NOSOLOGY_ZONE_LABELS, searchNosologies, type Nosology } from "@repo/nosology";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../theme";

const ALL = getSeedNosologies();

export default function NosologyScreen() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Nosology | null>(null);

  const list = useMemo(() => {
    if (!query.trim()) return ALL;
    const hits = searchNosologies(ALL, query);
    const ids = new Set(hits.map((h) => h.id));
    return ALL.filter((n) => ids.has(n.id));
  }, [query]);

  if (active) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Pressable onPress={() => setActive(null)} style={styles.back}>
          <Text style={styles.backText}>← Назад</Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.detail}>
          <Text style={styles.title}>{active.title}</Text>
          <Text style={styles.meta}>{NOSOLOGY_ZONE_LABELS[active.zone]}</Text>
          <Text style={styles.body}>{active.description}</Text>
          <Section title="Обследование" items={active.examinationScheme.checklist ?? active.examinationScheme.bullets} />
          <Section title="Диагностика" items={active.diagnostics.bullets} />
          <Section title="Лечение" items={active.treatment.bullets} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Нозологии</Text>
      <TextInput
        style={styles.search}
        placeholder="Поиск…"
        placeholderTextColor={theme.colors.textSecondary}
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView>
        {list.map((n) => (
          <Pressable key={n.id} style={styles.row} onPress={() => setActive(n)}>
            <Text style={styles.rowTitle}>{n.title}</Text>
            <Text style={styles.rowSub}>{n.description.slice(0, 80)}…</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((x) => (
        <Text key={x} style={styles.bullet}>
          • {x}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  search: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 10,
    color: theme.colors.text,
  },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  rowSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  back: { marginBottom: 8 },
  backText: { color: theme.colors.primary, fontWeight: "600" },
  detail: { paddingBottom: 40 },
  body: { marginTop: 8, fontSize: 14, lineHeight: 20, color: theme.colors.text },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  bullet: { fontSize: 13, lineHeight: 19, color: theme.colors.text, marginTop: 6 },
});
