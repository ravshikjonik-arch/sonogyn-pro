import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TeachingCasePreview } from "../features/teachingCases/types";
import { branding } from "../config/branding";
import { theme } from "../theme";

function TeachingCaseCard({
  item,
  onPress,
}: {
  item: TeachingCasePreview;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        {item.oradsCategory != null ? (
          <View style={styles.oradsBadge}>
            <Text style={styles.oradsText}>O-RADS {item.oradsCategory}</Text>
          </View>
        ) : null}
        <Text style={styles.anatomy}>{item.anatomy ?? "—"}</Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      <Text numberOfLines={2} style={styles.description}>
        {item.description ?? "Без описания"}
      </Text>
      {item.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export default memo(TeachingCaseCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: 6,
    ...theme.shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  oradsBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  oradsText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  anatomy: { fontSize: 11, color: branding.colors.textSecondary, flex: 1, textAlign: "right" },
  title: { fontSize: 14, fontWeight: "700", color: branding.colors.text },
  description: { fontSize: 12, color: branding.colors.textSecondary, lineHeight: 17 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  tag: { fontSize: 10, color: branding.colors.primary, fontWeight: "600" },
});
