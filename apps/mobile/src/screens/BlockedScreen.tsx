import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function BlockedScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Аккаунт заблокирован</Text>
        <Text style={styles.text}>
          Ваш аккаунт заблокирован за нарушение правил
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#991b1b" },
  text: { color: "#334155", lineHeight: 21 },
});
