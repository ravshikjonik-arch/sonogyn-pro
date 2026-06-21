import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  searchPatterns,
  TIRADS_ATLAS_INTRO,
  type ThyroidPatternEntry,
} from "@repo/tirads-acr";

import { branding } from "../../../config/branding";
import { theme } from "../../../theme";
import { resolveTiradsAtlasPreview } from "../resolveTiradsAtlas";
import TiradsAtlasImage from "./TiradsAtlasImage";

type Cat = "all" | "benign" | "borderline" | "malignant";

type Props = {
  onApply: (pattern: ThyroidPatternEntry) => void;
};

function PatternCard({ entry, onApply }: { entry: ThyroidPatternEntry; onApply: () => void }) {
  const preview = useMemo(
    () => resolveTiradsAtlasPreview(entry.imageFile, entry.nameRu),
    [entry.imageFile, entry.nameRu],
  );

  return (
    <View style={styles.card}>
      <TiradsAtlasImage preview={preview} />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{entry.nameRu}</Text>
          <Text style={styles.trBadge}>{entry.typicalTirads}</Text>
        </View>
        {entry.ultrasoundAppearance.slice(0, 3).map((line) => (
          <Text key={line} style={styles.bullet}>
            • {line}
          </Text>
        ))}
        <Text style={styles.summary}>{entry.educationSummary}</Text>
        <Pressable style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.applyText}>Применить паттерн</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CAT_LABELS: Record<Cat, string> = {
  all: "Все",
  benign: "Доброкач.",
  borderline: "Погранич.",
  malignant: "Злокач.",
};

/** Thyroid Pattern Recognition — 27 эхокартин ACR TI-RADS. */
export default function TiradsPatternPanel({ onApply }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const patterns = useMemo(() => {
    let list = searchPatterns(query);
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    return list;
  }, [query, cat]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>{TIRADS_ATLAS_INTRO}</Text>
      <TextInput
        style={styles.search}
        placeholder="Поиск: PTC, colloid, spongiform…"
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.filters}>
        {(["all", "benign", "borderline", "malignant"] as const).map((c) => (
          <Pressable key={c} style={[styles.filterChip, cat === c && styles.filterOn]} onPress={() => setCat(c)}>
            <Text style={[styles.filterText, cat === c && styles.filterTextOn]}>{CAT_LABELS[c]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.count}>{patterns.length} паттернов</Text>
      {patterns.map((p) => (
        <PatternCard key={p.id} entry={p} onApply={() => onApply(p)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24, paddingHorizontal: 0 },
  intro: { fontSize: 13, color: branding.colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    marginBottom: 10,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  filterOn: { borderColor: "#0284c7", backgroundColor: "#e0f2fe" },
  filterText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  filterTextOn: { color: "#0369a1" },
  count: { fontSize: 11, color: "#94a3b8", marginBottom: 12 },
  card: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    backgroundColor: "#fff",
    overflow: "hidden",
    ...theme.shadow.card,
  },
  cardBody: { padding: 12, gap: 4 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: branding.colors.text },
  trBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0369a1",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  bullet: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  summary: { fontSize: 12, color: branding.colors.textSecondary, marginTop: 4, lineHeight: 17 },
  applyBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#0284c7",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  applyText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
