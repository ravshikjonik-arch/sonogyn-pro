import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  ORADS_BOOK_DISCLAIMER_RU,
  getPhotocardsForTumor,
  listOradsBookTumorGroups,
  resolveOradsBookPhotocardSrc,
  searchOradsBookTumorCards,
  type OradsBookTumorCard,
} from "@repo/orads-us/book-ovary";

/** Expo / RN: absolute URL to web public assets when WEB_ORIGIN set; else relative path for docs. */
function photocardUri(file: string): string {
  const path = resolveOradsBookPhotocardSrc(file);
  const origin = process.env.EXPO_PUBLIC_WEB_ORIGIN?.replace(/\/$/, "");
  return origin ? `${origin}${path}` : path;
}

function Card({ card }: { card: OradsBookTumorCard }) {
  const photos = getPhotocardsForTumor(card.id).slice(0, 1);
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.cardTitle}>{card.name}</Text>
      <Text style={styles.cardGroup}>{card.group}</Text>
      <Text style={styles.meta}>Возраст: {card.age}</Text>
      <Text style={styles.meta}>Латеральность: {card.laterality}</Text>
      <Text style={styles.body}>{card.appearance}</Text>
      <Text style={styles.body}>{card.typical_features}</Text>
      <Text style={styles.meta}>ЦДК: {card.color_score}</Text>
      {photos[0] ? (
        <Image
          source={{ uri: photocardUri(photos[0].file) }}
          style={styles.photo}
          accessibilityLabel={photos[0].titleRu}
        />
      ) : null}
    </View>
  );
}

export default function OradsBookTumorCardsSection() {
  const groups = useMemo(() => listOradsBookTumorGroups(), []);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchOradsBookTumorCards(query, group || undefined).slice(0, 12), [query, group]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.headerBtn}
      >
        <Text style={styles.headerTitle}>Дифф. диагноз · 32 типа</Text>
        <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.bodyWrap}>
          <Text style={styles.lead}>
            Справочник по пособию. Не меняет категорию O-RADS — только подсказки по виду и маркерам.
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск: название, СА-125…"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            accessibilityLabel="Поиск по карточкам опухолей"
          />
          <View style={styles.chips}>
            <Pressable
              style={[styles.chip, !group && styles.chipOn]}
              onPress={() => setGroup("")}
              accessibilityRole="button"
              accessibilityState={{ selected: !group }}
            >
              <Text style={[styles.chipText, !group && styles.chipTextOn]}>Все</Text>
            </Pressable>
            {groups.slice(0, 8).map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, group === g && styles.chipOn]}
                onPress={() => setGroup(g)}
                accessibilityRole="button"
                accessibilityState={{ selected: group === g }}
              >
                <Text style={[styles.chipText, group === g && styles.chipTextOn]} numberOfLines={1}>
                  {g.length > 28 ? `${g.slice(0, 26)}…` : g}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.count}>Показано до 12 из найденных</Text>
          {results.map((c) => (
            <Card key={c.id} card={c} />
          ))}
          <Text style={styles.disclaimer}>{ORADS_BOOK_DISCLAIMER_RU}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  chevron: { fontSize: 16, color: "#64748b" },
  bodyWrap: { paddingHorizontal: 12, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  lead: { fontSize: 12, color: "#64748b", lineHeight: 18, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  chipOn: { borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,0.08)" },
  chipText: { fontSize: 11, color: "#334155", fontWeight: "600" },
  chipTextOn: { color: "#1d4ed8" },
  count: { fontSize: 11, color: "#64748b" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    gap: 4,
    backgroundColor: "#f8fafc",
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  cardGroup: { fontSize: 11, color: "#64748b" },
  meta: { fontSize: 12, color: "#334155" },
  body: { fontSize: 12, color: "#0f172a", lineHeight: 17 },
  photo: { marginTop: 6, width: "100%", height: 120, borderRadius: 8, backgroundColor: "#e2e8f0" },
  disclaimer: { fontSize: 10, color: "#94a3b8", lineHeight: 14, marginTop: 4 },
});
