import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClinicalToolSearchBar } from "../../components/clinical/ClinicalToolSearch";
import { openTelegramChannel } from "../../config/community";
import { TELEGRAM_CHANNEL } from "../../config/telegram";
import { openClinicalToolAction, openWebPath } from "../../lib/clinical-tools/openClinicalTool";
import type { ClinicalToolNav } from "../../lib/clinical-tools/openClinicalTool";

type Props = {
  navigation: ClinicalToolNav & NavigationProp<ParamListBase>;
  /** Hide duplicate page title when embedded in Tools tab. */
  embedded?: boolean;
};

export function ReferenceHubPanel({ navigation, embedded }: Props) {
  const rows = [
    {
      id: "quiz-hub",
      title: "Клинические задачи · Quiz hub",
      sub: "Самопроверка O-RADS · IOTA · акушерство · шейка",
      onPress: () => void openWebPath("/tools/refs/quiz-hub"),
    },
    {
      id: "orads-hub",
      title: "O-RADS · эхограммы и calc",
      sub: "Калькулятор + учебные карточки + реферат — один хаб",
      onPress: () => void openWebPath("/tools/o-rads"),
    },
    {
      id: "ob-hub",
      title: "Акушерство",
      sub: "FMF · срок Б · атласы · помощник акушера",
      onPress: () => void openWebPath("/tools/obstetrics"),
    },
    {
      id: "gyn-hub",
      title: "Гинекология",
      sub: "FIGO · эндометрий · нозологии · помощник",
      onPress: () => void openWebPath("/tools/gynecology"),
    },
    {
      id: "evidence-assistant",
      title: "Evidence Assistant",
      sub: "PubMed · Cochrane · КР · AI-резюме · native",
      onPress: () => navigation.navigate("EvidenceAssistant"),
    },
    {
      id: "evidence-base",
      title: "SonoEvidence · база",
      sub: "236 тем · FMF · O-RADS · шейка",
      onPress: () => void openWebPath("/tools/refs/evidence"),
    },
    {
      id: "guidelines",
      title: "КР и приказы",
      sub: "МЗ РФ · ДЗМ · полки",
      onPress: () => {
        const state = navigation.getState();
        const onTools =
          state.routeNames.includes("ToolsTab") ||
          (state.routes[state.index ?? 0]?.name === "ToolsTab");
        if (onTools && "setParams" in navigation && typeof navigation.setParams === "function") {
          navigation.setParams({ panel: "reference", referenceSection: "guidelines" });
          return;
        }
        if (state.routeNames.includes("ToolsTab")) {
          navigation.navigate("ToolsTab", { panel: "reference", referenceSection: "guidelines" });
          return;
        }
        navigation.navigate("Main", {
          screen: "ToolsTab",
          params: { panel: "reference", referenceSection: "guidelines" },
        });
      },
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
      id: "cervix-quiz",
      title: "Самопроверка · цитология РШМ",
      sub: "Quiz для врача, ординатора, студента",
      onPress: () => navigation.navigate("CervixCytologyModule", { topic: "quiz" }),
    },
    {
      id: "cervix-pathology",
      title: "Патология шейки · цитология",
      sub: "Native: Bethesda, HPV, скрининг, кейсы, quiz",
      onPress: () => navigation.navigate("CervixCytologyModule"),
    },
    {
      id: "medvedev",
      title: "Консенсусы УЗИ",
      sub: "MUSA · IETA · IOTA · IDEA",
      onPress: () => openClinicalToolAction(navigation, "medvedev"),
    },
    {
      id: "orads-echograms",
      title: "O-RADS · эхограммы",
      sub: "Учебные карточки по нозологиям",
      onPress: () => void openWebPath("/tools/refs/orads-echograms"),
    },
    {
      id: "orads-flow",
      title: "O-RADS · дерево решений",
      sub: "Учебный flow (native)",
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
    <>
      {!embedded ? (
        <View style={styles.header}>
          <Text style={styles.kicker}>Знания</Text>
          <Text style={styles.title}>Справочник</Text>
          <Text style={styles.sub}>КР · нормы · нозологии · EBM</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClinicalToolSearchBar navigation={navigation} placeholder="КР, нормы, нозология…" compact />
        {rows.map((r) => (
          <Pressable key={r.id} style={styles.row} onPress={r.onPress}>
            <Text style={styles.rowTitle}>{r.title}</Text>
            <Text style={styles.rowSub}>{r.sub}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
});
