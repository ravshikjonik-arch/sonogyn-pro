import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TELEGRAM_CHANNEL } from "../config/telegram";
import { SafeAreaView } from "react-native-safe-area-context";
import { branding } from "../config/branding";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type LibraryTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "LibraryTab">,
  NativeStackScreenProps<RootStackParamList>
>;

type Row = { id: string; title: string; sub: string; onPress: () => void };

export default function LibraryScreen({ navigation }: LibraryTabScreenProps) {
  const rows: Row[] = [
    {
      id: "telegram",
      title: TELEGRAM_CHANNEL.name,
      sub: "Telegram · аналитика и обновления для врачей",
      onPress: () => void Linking.openURL(TELEGRAM_CHANNEL.url),
    },
    {
      id: "nosology",
      title: "Нозологии",
      sub: "Заболевания: обследование, УЗ-диагностика, лечение",
      onPress: () => navigation.navigate("Nosology"),
    },
    {
      id: "clinical-ref",
      title: "Клинические нормы УЗИ",
      sub: "Методики измерений, скрининги, ISUOG / Hadlock",
      onPress: () => navigation.navigate("ClinicalReference"),
    },
    {
      id: "figo",
      title: "Матка · FIGO + аденомиоз / ДИЭ",
      sub: "Интерактив FIGO и объединённый протокол",
      onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_uterus_clinic" }),
    },
    {
      id: "orads",
      title: "O-RADS Library",
      sub: "Дерево решений и протоколы",
      onPress: () => navigation.navigate("ORADSFlow"),
    },
    {
      id: "anat",
      title: "Anatomy",
      sub: "Сроки · УЗИ · ориентиры I–III триместра",
      onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_hub" }),
    },
    {
      id: "edu",
      title: "Educational materials",
      sub: "FMF prenatal assistant",
      onPress: () => navigation.navigate("FMFAssistant"),
    },
    {
      id: "tirads",
      title: "TI-RADS",
      sub: "Щитовидная железа · скрининг УЗИ",
      onPress: () => navigation.navigate("TiRadsAssistant"),
    },
    {
      id: "medvedev",
      title: "УЗИ гинекология",
      sub: "Консенсусы MUSA / IETA / IOTA / IDEA (Medvedev 2018)",
      onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_medvedev_consensus" }),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Знания</Text>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.sub}>Справочники без смешения с кейсами</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {rows.map((r, i) => (
          <Pressable
            key={r.id}
            style={[styles.row, i === rows.length - 1 && styles.rowLast]}
            onPress={r.onPress}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowSub}>{r.sub}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  header: { paddingHorizontal: theme.spacing.md, marginBottom: 16 },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: { fontSize: 26, fontWeight: "700", color: branding.colors.text, marginTop: 4 },
  sub: { fontSize: 14, color: branding.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...theme.shadow.card,
  },
  rowLast: { marginBottom: 0 },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: branding.colors.text },
  rowSub: { fontSize: 13, color: branding.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  chev: { fontSize: 22, color: "#cbd5e1", fontWeight: "300" },
});
