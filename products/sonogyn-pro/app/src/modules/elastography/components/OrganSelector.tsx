import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import type { ElastographyOrgan } from "../types";

type Props = {
  t: (key: string) => string;
  selected: ElastographyOrgan | null;
  onSelect: (organ: ElastographyOrgan) => void;
};

type CardDef = {
  id: ElastographyOrgan;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subKey: string;
  disabled?: boolean;
};

const CARDS: CardDef[] = [
  { id: "cervix", icon: "medical", titleKey: "elasto_organ_cervix", subKey: "elasto_organ_cervix_sub" },
  { id: "myometrium", icon: "ellipse", titleKey: "elasto_organ_myometrium", subKey: "elasto_organ_myometrium_sub" },
  { id: "ovary", icon: "egg-outline", titleKey: "elasto_organ_ovary", subKey: "elasto_organ_ovary_sub" },
  { id: "breast", icon: "heart-outline", titleKey: "elasto_organ_breast", subKey: "elasto_organ_breast_sub" },
  { id: "abdomen_liver", icon: "water-outline", titleKey: "elasto_organ_liver", subKey: "elasto_organ_liver_soon", disabled: true },
];

export default function OrganSelector({ t, selected, onSelect }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={styles.grid}>
      {CARDS.map((c) => {
        const active = selected === c.id;
        return (
          <Pressable
            key={c.id}
            disabled={c.disabled}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityLabel={t(c.titleKey)}
            accessibilityState={{ disabled: !!c.disabled, selected: active }}
            style={[
              styles.card,
              isDark && styles.cardDark,
              active && styles.cardActive,
              c.disabled && styles.cardDisabled,
            ]}
          >
            <Ionicons name={c.icon} size={28} color={c.disabled ? "#94a3b8" : active ? "#6D28D9" : "#0F2744"} />
            <Text style={[styles.title, isDark && styles.titleDark, c.disabled && styles.muted]}>{t(c.titleKey)}</Text>
            <Text style={[styles.sub, c.disabled && styles.muted]}>
              {c.disabled ? t("elasto_organ_liver_soon") : t(c.subKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    minHeight: 120,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EDF2",
    gap: 6,
  },
  cardDark: { backgroundColor: "#1e293b", borderColor: "#334155" },
  cardActive: { borderColor: "#6D28D9", borderWidth: 2, backgroundColor: "#F5F3FF" },
  cardDisabled: { opacity: 0.55 },
  title: { fontSize: 15, fontWeight: "800", color: "#0F2744" },
  titleDark: { color: "#f1f5f9" },
  sub: { fontSize: 12, color: "#5C6B7A", lineHeight: 16 },
  muted: { color: "#94a3b8" },
});
