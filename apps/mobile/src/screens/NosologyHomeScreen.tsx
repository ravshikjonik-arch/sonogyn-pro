import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { openClinicalToolAction, openGynPage, openWebPath } from "../lib/clinical-tools/openClinicalTool";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ToolsTab">,
  NativeStackScreenProps<RootStackParamList>
>;

type Row = {
  title: string;
  detail: string;
  onPress: () => void;
};

export default function NosologyHomeScreen({ navigation }: Props) {
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Сразу к работе",
      rows: [
        { title: "Чат врачей", detail: "Общий канал и специальности", onPress: () => openClinicalToolAction(navigation, "chat_web") },
        { title: "AI-помощник", detail: "Разбор без персональных данных", onPress: () => navigation.navigate("AiTab") },
        { title: "Кейсы и обучение", detail: "Учебные случаи и задачи", onPress: () => void openWebPath("/tools/refs/quiz-hub") },
      ],
    },
    {
      title: "Акушерство",
      rows: [
        { title: "Акушерский калькулятор", detail: "Срок, фетометрия, риски", onPress: () => void openWebPath("/tools/calc/ob") },
        { title: "FMF и скрининг", detail: "I триместр, КТР, ТВП", onPress: () => openClinicalToolAction(navigation, "fmf") },
        { title: "Нормы фетометрии", detail: "Таблицы по сроку", onPress: () => openClinicalToolAction(navigation, "fetometry_nomograms") },
        { title: "Шейка матки", detail: "Длина шейки", onPress: () => openClinicalToolAction(navigation, "cervical_length") },
        { title: "Протоколы и атлас", detail: "Срезы, допплер, отчёт", onPress: () => void openWebPath("/tools/obstetrics") },
      ],
    },
    {
      title: "Гинекология",
      rows: [
        { title: "O-RADS", detail: "Образования придатков", onPress: () => openClinicalToolAction(navigation, "orads") },
        { title: "IOTA", detail: "Простые правила и ADNEX", onPress: () => openClinicalToolAction(navigation, "iota") },
        { title: "Калькуляторы", detail: "Эндометрий, POP-Q, шейка", onPress: () => openClinicalToolAction(navigation, "gyn_hub") },
        { title: "Нозологии", detail: "Миома, эндометрий, яичник", onPress: () => openClinicalToolAction(navigation, "nosology") },
        { title: "FIGO · миома", detail: "Тип узла на схеме матки", onPress: () => openClinicalToolAction(navigation, "uterus_clinic") },
      ],
    },
    {
      title: "Маммология",
      rows: [
        { title: "BI-RADS", detail: "Категория и протокол", onPress: () => openClinicalToolAction(navigation, "birads") },
        { title: "Оценка риска", detail: "Ориентир, не диагноз", onPress: () => openGynPage(navigation, "gyn_breast_risk") },
        { title: "Атлас", detail: "Учебные изображения", onPress: () => void openWebPath("/tools/refs/mammology-national-atlas") },
      ],
    },
    {
      title: "УЗ-диагностика",
      rows: [
        { title: "TI-RADS", detail: "Щитовидная железа", onPress: () => openClinicalToolAction(navigation, "tirads") },
        { title: "LN-RADS", detail: "Лимфоузлы", onPress: () => openClinicalToolAction(navigation, "ln_rads") },
        {
          title: "Все калькуляторы",
          detail: "Акушерство, гинекология, RADS",
          onPress: () => navigation.setParams({ panel: "calculators" }),
        },
        {
          title: "Справочник",
          detail: "КР, нормы, атласы",
          onPress: () => navigation.setParams({ panel: "reference" }),
        },
      ],
    },
    {
      title: "Аптека",
      rows: [{ title: "Аптека врача", detail: "Препараты для практики", onPress: () => void openWebPath("/tools/pharmacy") }],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image source={require("../../assets/icon.png")} style={styles.mark} accessibilityLabel="SonoGyn Pro" />
          <View style={styles.headerText}>
            <Text style={styles.title}>SonoGyn Pro</Text>
            <Text style={styles.subtitle}>Разделы по нозологиям. Решение остаётся за врачом.</Text>
          </View>
        </View>
        {groups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.rows.map((row, index) => (
                <Pressable
                  key={row.title}
                  style={[styles.row, index > 0 && styles.rowBorder]}
                  onPress={row.onPress}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowDetail}>{row.detail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.footer}>Справочная поддержка. Не ставит диагноз.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6f8" },
  scroll: { padding: 16, paddingBottom: 28, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  mark: { width: 56, height: 56, borderRadius: 16 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  subtitle: { marginTop: 2, fontSize: 13, lineHeight: 18, color: "#64748b" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#64748b", paddingHorizontal: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e8ecf1", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#e8ecf1" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  rowDetail: { marginTop: 2, fontSize: 12, color: "#64748b" },
  footer: { fontSize: 12, color: "#94a3b8", paddingHorizontal: 4 },
});
