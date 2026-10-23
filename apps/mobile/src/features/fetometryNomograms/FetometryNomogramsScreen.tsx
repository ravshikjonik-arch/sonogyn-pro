import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { NOMOGRAM_DATASET } from "@repo/fetal-nomograms";
import { medvedevArchiveBookStats } from "@repo/medvedev-reference";

import type { RootStackParamList } from "../../navigation/paramLists";
import { ArchiveNormsPanel } from "./ArchiveNormsPanel";
import { NomogramWizardPanel } from "./NomogramWizardPanel";

type Props = NativeStackScreenProps<RootStackParamList, "FetometryNomograms">;

type Mode = "wizard" | "archive";

export default function FetometryNomogramsScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>("wizard");
  const nomoCount = NOMOGRAM_DATASET.nomograms.length;
  const archiveCount = medvedevArchiveBookStats().totalCards;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Назад">
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.kicker}>Акушерство</Text>
        <Text style={styles.title}>Нормы фетометрии</Text>
        <Text style={styles.sub}>Номограммы и табличный архив — как на web</Text>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "wizard" && styles.tabActive]}
            onPress={() => setMode("wizard")}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "wizard" }}
          >
            <Text style={[styles.tabText, mode === "wizard" && styles.tabTextActive]}>
              Мастер ({nomoCount})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "archive" && styles.tabActive]}
            onPress={() => setMode("archive")}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "archive" }}
          >
            <Text style={[styles.tabText, mode === "archive" && styles.tabTextActive]}>
              Каталог ({archiveCount})
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {mode === "wizard" ? <NomogramWizardPanel /> : <ArchiveNormsPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF2",
    gap: 4,
  },
  back: { fontSize: 15, color: "#0d9488", fontWeight: "600", marginBottom: 4 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: "800", color: "#0F2744" },
  sub: { fontSize: 13, color: "#64748b" },
  tabs: { flexDirection: "row", gap: 8, marginTop: 10 },
  tab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabActive: { borderColor: "#0F2744", backgroundColor: "#0F2744" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  tabTextActive: { color: "#fff" },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
});
