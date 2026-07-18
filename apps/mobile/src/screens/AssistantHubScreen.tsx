import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
        <Text style={styles.sub}>Спросите или выберите маршрут — нужное за 1–2 клика</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <ClinicalToolSearchBar navigation={navigation} placeholder="Что нужно найти на приёме?" />
        <Pressable
          style={[styles.card, { backgroundColor: "#831843" }]}
          onPress={() => openClinicalToolAction(navigation, "gyn_assistant_gyn")}
        >
          <Text style={styles.cardKicker}>Ежедневный приём</Text>
          <Text style={styles.cardTitle}>Помощник врача-гинеколога</Text>
          <Text style={styles.cardSub}>Нозология → обследования → тактика → источник</Text>
        </Pressable>
        <Pressable
          style={[styles.card, { backgroundColor: "#0f766e" }]}
          onPress={() => openClinicalToolAction(navigation, "gyn_assistant_obs")}
        >
          <Text style={styles.cardKicker}>Беременность</Text>
          <Text style={styles.cardTitle}>Помощник врача-акушера</Text>
          <Text style={styles.cardSub}>Беременность → риски → тактика → КР / приказы</Text>
        </Pressable>
        <Pressable
          style={[styles.card, { backgroundColor: "#075985" }]}
          onPress={() => openClinicalToolAction(navigation, "ultrasound_assistant")}
        >
          <Text style={styles.cardKicker}>УЗИ и протокол</Text>
          <Text style={styles.cardTitle}>Помощник врача УЗИ</Text>
          <Text style={styles.cardSub}>Карта органа → локализация → классификация → протокол</Text>
        </Pressable>
        <Pressable
          style={styles.cardOutline}
          onPress={() => navigation.navigate("CervixCytologyModule", { topic: "ai-assist" })}
        >
          <Text style={styles.cardOutlineTitle}>AI · Bethesda (шейка)</Text>
          <Text style={styles.cardOutlineSub}>Интерпретация цитологии без PHI · образовательно</Text>
        </Pressable>
        <Pressable
          style={styles.cardOutline}
          onPress={() => openClinicalToolAction(navigation, "evidence_assistant")}
        >
          <Text style={styles.cardOutlineTitle}>Evidence AI</Text>
          <Text style={styles.cardOutlineSub}>PubMed · Cochrane · КР · закладки</Text>
        </Pressable>
        <View style={styles.domainRow}>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "orads_hub")}>
            <Text style={styles.domainChipText}>O-RADS</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "birads")}>
            <Text style={styles.domainChipText}>BI-RADS</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "tirads")}>
            <Text style={styles.domainChipText}>TI-RADS</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "uterus_clinic")}>
            <Text style={styles.domainChipText}>Матка / FIGO</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "breast_3d")}>
            <Text style={styles.domainChipText}>Карта МЖ</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "cervix_pathology")}>
            <Text style={styles.domainChipText}>Цитология РШМ</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "fmf")}>
            <Text style={styles.domainChipText}>FMF / скрининг</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6B7C8F", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F2744", marginTop: 4 },
  sub: { fontSize: 14, color: "#5C6B7A", marginTop: 4, lineHeight: 20 },
  body: { paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
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
  domainRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  domainChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  domainChipText: { fontSize: 12, fontWeight: "700", color: "#0f2744" },
});
