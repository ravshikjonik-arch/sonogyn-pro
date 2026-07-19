import { StyleSheet, Text, View } from "react-native";

import type { CervixTheme } from "../useCervixTheme";

type Props = {
  title: string;
  theme: CervixTheme;
  children: React.ReactNode;
};

export function SectionBlock({ title, theme, children }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export function BodyText({ children, theme }: { children: React.ReactNode; theme: CervixTheme }) {
  return <Text style={[styles.body, { color: theme.colors.text }]}>{children}</Text>;
}

export function MutedText({ children, theme }: { children: React.ReactNode; theme: CervixTheme }) {
  return <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{children}</Text>;
}

export function KeyRow({ label, value, theme }: { label: string; value: React.ReactNode; theme: CervixTheme }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.kvValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

export function BulletList({ items, theme }: { items: string[]; theme: CervixTheme }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Text key={item} style={[styles.bullet, { color: theme.colors.text }]}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 20 },
  muted: { fontSize: 13, lineHeight: 18 },
  kv: { gap: 2 },
  kvLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  kvValue: { fontSize: 14, lineHeight: 20 },
  list: { gap: 4 },
  bullet: { fontSize: 14, lineHeight: 20 },
});
