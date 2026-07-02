import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClinicalToolSearchBar } from "../components/clinical/ClinicalToolSearch";
import GuidelinesTabScreen from "../modules/clinicalGuidelines/screens/GuidelinesTabScreen";
import { openTelegramChannel } from "../config/community";
import { TELEGRAM_CHANNEL } from "../config/telegram";
import { openClinicalToolAction } from "../lib/clinical-tools/openClinicalTool";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

export type KnowledgeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "KnowledgeTab">,
  NativeStackScreenProps<RootStackParamList>
>;

type Section = "hub" | "guidelines";

export default function KnowledgeScreen({ navigation, route }: KnowledgeTabScreenProps) {
  const initial = route.params?.section === "guidelines" ? "guidelines" : "hub";
  const [section, setSection] = useState<Section>(initial);

  if (section === "guidelines") {
    return (
      <View style={{ flex: 1 }}>
        <Pressable style={styles.backBar} onPress={() => setSection("hub")}>
          <Text style={styles.backBarText}>← Справочник</Text>
        </Pressable>
        <GuidelinesTabScreen navigation={navigation} route={route as never} />
      </View>
    );
  }

  const rows = [
    {
      id: "guidelines",
      title: "КР и приказы",
      sub: "МЗ РФ · ДЗМ · полки",
      onPress: () => setSection("guidelines"),
    },
    {
      id: "nosology",
      title: "Нозологии",
      sub: "Заболевания: обследование, УЗИ, лечение",
      onPress: () => navigation.navigate("Nosology"),
    },
    {
      id: "clinical-ref",
      title: "Клинические нормы УЗИ",
      sub: "ISUOG / Hadlock",
      onPress: () => navigation.navigate("ClinicalReference"),
    },
    {
      id: "cervix-pathology",
      title: "Патология шейки · цитология",
      sub: "8 глав, Bethesda, HPV, алгоритмы, кейсы, quiz",
      onPress: () => openClinicalToolAction(navigation, "cervix_pathology"),
    },
    {
      id: "medvedev",
      title: "Консенсусы УЗИ",
      sub: "MUSA · IETA · IOTA · IDEA",
      onPress: () => openClinicalToolAction(navigation, "medvedev"),
    },
    {
      id: "orads-flow",
      title: "O-RADS Library",
      sub: "Дерево решений (учебное)",
      onPress: () => navigation.navigate("ORADSFlow"),
    },
    {
      id: "telegram",
      title: TELEGRAM_CHANNEL.name,
      sub: "Telegram · @UltraGynAnalytics",
      onPress: () => void openTelegramChannel(),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Знания</Text>
        <Text style={styles.title}>Справочник</Text>
        <Text style={styles.sub}>КР · нормы · консенсусы — без дублей калькуляторов</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClinicalToolSearchBar navigation={navigation} placeholder="КР, нормы, нозология…" compact />
        {rows.map((r) => (
          <Pressable key={r.id} style={styles.row} onPress={r.onPress}>
            <Text style={styles.rowTitle}>{r.title}</Text>
            <Text style={styles.rowSub}>{r.sub}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6B7C8F", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F2744", marginTop: 4 },
  sub: { fontSize: 14, color: "#5C6B7A", marginTop: 4 },
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },
  row: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rowTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  rowSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  backBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backBarText: { fontWeight: "700", color: "#0f172a" },
});
