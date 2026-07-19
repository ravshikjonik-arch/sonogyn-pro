import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import type { CervixTheme } from "../useCervixTheme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  theme: CervixTheme;
};

export function ChipSelect<T extends string>({ options, value, onChange, theme }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.chip,
              {
                backgroundColor: on ? theme.colors.chipOn : theme.colors.chip,
                borderColor: on ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.chipText, { color: on ? theme.colors.chipOnText : theme.colors.text }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
});
