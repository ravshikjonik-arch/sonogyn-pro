import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import type { ElastographyMethod } from "../types";

type Props = {
  t: (key: string) => string;
  methods: ElastographyMethod[];
  selected: ElastographyMethod | null;
  onSelect: (method: ElastographyMethod) => void;
};

const META: Record<ElastographyMethod, { titleKey: string; descKey: string }> = {
  strain: { titleKey: "elasto_method_strain", descKey: "elasto_method_strain_desc" },
  shear_wave: { titleKey: "elasto_method_swe", descKey: "elasto_method_swe_desc" },
  both: { titleKey: "elasto_method_both", descKey: "elasto_method_both_desc" },
};

export default function MethodSelector({ t, methods, selected, onSelect }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={styles.list}>
      {methods.map((m) => {
        const active = selected === m;
        const meta = META[m];
        return (
          <Pressable
            key={m}
            onPress={() => onSelect(m)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.row, isDark && styles.rowDark, active && styles.rowActive]}
          >
            <View style={[styles.dot, active && styles.dotActive]} />
            <View style={styles.textCol}>
              <Text style={[styles.title, isDark && styles.titleDark]}>{t(meta.titleKey)}</Text>
              <Text style={styles.desc}>{t(meta.descKey)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  rowDark: { backgroundColor: "#1e293b", borderColor: "#334155" },
  rowActive: { borderColor: "#6D28D9", backgroundColor: "#F5F3FF" },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: "#cbd5e1" },
  dotActive: { backgroundColor: "#6D28D9" },
  textCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#0F2744" },
  titleDark: { color: "#f1f5f9" },
  desc: { fontSize: 13, color: "#5C6B7A", marginTop: 4, lineHeight: 18 },
});
