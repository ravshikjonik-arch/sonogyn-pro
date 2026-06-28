import { FIGO_ATLAS_ENTRIES } from "@repo/clinical-3d";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

export default function FigoUsAtlasPanel() {
  const [idx, setIdx] = useState(0);
  const entry = FIGO_ATLAS_ENTRIES[idx] ?? FIGO_ATLAS_ENTRIES[0]!;

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Атлас УЗИ · FIGO (учебный)</Text>
      <Text style={s.meta}>11 типов · сагиттальный TVUS-стиль · без подписей на снимке</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {FIGO_ATLAS_ENTRIES.map((e, i) => (
          <Pressable
            key={e.code}
            style={[s.chip, i === idx && s.chipOn]}
            onPress={() => setIdx(i)}
          >
            <Text style={[s.chipText, i === idx && s.chipTextOn]}>{e.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.card}>
        <Text style={s.figoTitle}>{entry.title}</Text>
        <Text style={s.loc}>{entry.localization}</Text>
        {entry.sonoGynBullets.map((b) => (
          <Text key={b} style={s.bullet}>
            • {b}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 14, fontWeight: "800", color: "#831843" },
  meta: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  chipOn: { backgroundColor: "#fdf4ff", borderColor: "#d946ef" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#86198f" },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    gap: 6,
  },
  figoTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  loc: { fontSize: 13, color: "#334155", lineHeight: 18 },
  bullet: { fontSize: 12, color: "#475569", lineHeight: 17 },
  detail: { fontSize: 11, color: "#64748b", lineHeight: 16, marginTop: 4 },
});
