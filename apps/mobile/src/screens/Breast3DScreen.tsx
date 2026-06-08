import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import BreastTopographyPanel from "../gynecology/BreastTopographyPanel";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "Breast3D">;

export default function Breast3DScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Назад">
          <Text style={styles.backBtnText}>← Назад</Text>
        </Pressable>
        <Text style={styles.title}>Макет молочной железы</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>
          Схема обеих МЖ: отметьте очаг — программа сформирует «N см от соска, X часов» для протокола. Полный BI-RADS — в
          калькуляторе МЖ.
        </Text>
        <BreastTopographyPanel />
        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("BiRadsAssistant")}>
          <Text style={styles.linkBtnText}>Открыть BI-RADS US →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 8 },
  backBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnText: { color: "#0f172a", fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a", flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  hint: { fontSize: 13, lineHeight: 19, color: "#475569" },
  linkBtn: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#005CB9",
    paddingVertical: 14,
    alignItems: "center",
  },
  linkBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
