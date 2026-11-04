import { StyleSheet, Text, View } from "react-native";

/**
 * Copyright B+: book photocards hidden from end users.
 * O-RADS engine / ACR wizard stay on the main Orads Pro screen.
 */
export default function OradsBookTumorCardsSection() {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>Дифф. диагноз</Text>
      <Text style={styles.body}>
        Учебные фотокарточки из пособий скрыты. Используйте пошаговый O-RADS ACR и официальные источники (ACR /
        FIGO / ISUOG / IOTA / КР).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  body: { fontSize: 12, lineHeight: 18, color: "#64748b" },
});
