import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClinicalToolSearchBar } from "../components/clinical/ClinicalToolSearch";
import { openClinicalToolAction } from "../lib/clinical-tools/openClinicalTool";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

export type AssistantTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "AssistantTab">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function AssistantHubScreen({ navigation }: AssistantTabScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Приём</Text>
        <Text style={styles.title}>Помощник врача</Text>
        <Text style={styles.sub}>МКБ → УЗИ → протокол · голосовой поиск на web</Text>
      </View>
      <View style={styles.body}>
        <ClinicalToolSearchBar navigation={navigation} placeholder="Нозология, МКБ, симптом…" />
        <Pressable
          style={[styles.card, { backgroundColor: "#831843" }]}
          onPress={() => openClinicalToolAction(navigation, "gyn_assistant_gyn")}
        >
          <Text style={styles.cardKicker}>Ежедневный приём</Text>
          <Text style={styles.cardTitle}>Помощник гинеколога</Text>
          <Text style={styles.cardSub}>Нозология → анализы → УЗИ → лечение</Text>
        </Pressable>
        <Pressable
          style={[styles.card, { backgroundColor: "#0f766e" }]}
          onPress={() => openClinicalToolAction(navigation, "gyn_assistant_obs")}
        >
          <Text style={styles.cardKicker}>Беременность</Text>
          <Text style={styles.cardTitle}>Помощник акушера</Text>
          <Text style={styles.cardSub}>Ранняя Б · потери · ГСД</Text>
        </Pressable>
        <Pressable style={styles.cardOutline} onPress={() => openClinicalToolAction(navigation, "gyn_hub")}>
          <Text style={styles.cardOutlineTitle}>Сроки и калькуляторы Б</Text>
          <Text style={styles.cardOutlineSub}>ПМП · КТР · декрет · фетометрия</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6B7C8F", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F2744", marginTop: 4 },
  sub: { fontSize: 14, color: "#5C6B7A", marginTop: 4, lineHeight: 20 },
  body: { paddingHorizontal: 16, gap: 14 },
  card: { borderRadius: 16, padding: 16 },
  cardKicker: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#fff", marginTop: 6 },
  cardSub: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 6, lineHeight: 18 },
  cardOutline: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  cardOutlineTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  cardOutlineSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
});
