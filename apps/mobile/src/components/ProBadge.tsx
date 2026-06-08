import { StyleSheet, Text, View } from "react-native";

type ProBadgeProps = {
  isPro: boolean;
  compact?: boolean;
};

export default function ProBadge({ isPro, compact = false }: ProBadgeProps) {
  return (
    <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree, compact && styles.compact]}>
      <Text style={[styles.text, isPro ? styles.textPro : styles.textFree]}>
        {isPro ? "PRO" : "FREE"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgePro: {
    backgroundColor: "#fffbeb",
    borderColor: "#f5d487",
  },
  badgeFree: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  text: {
    fontWeight: "700",
    fontSize: 11,
  },
  textPro: { color: "#a16207" },
  textFree: { color: "#475569" },
});
