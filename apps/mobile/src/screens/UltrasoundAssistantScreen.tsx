import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ORADS_NOSOLOGY_ATLAS } from "@repo/orads-us";

import { openClinicalToolAction, webAppUrl } from "../lib/clinical-tools/openClinicalTool";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "UltrasoundAssistant">;

type RouteCard = {
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  onPress: () => void;
};

function RouteCardView({ item }: { item: RouteCard }) {
  return (
    <Pressable style={[styles.routeCard, { borderLeftColor: item.color }]} onPress={item.onPress}>
      <View style={styles.routeTop}>
        <Text style={[styles.routeBadge, { color: item.color }]}>{item.badge}</Text>
      </View>
      <Text style={styles.routeTitle}>{item.title}</Text>
      <Text style={styles.routeSub}>{item.subtitle}</Text>
    </Pressable>
  );
}

export default function UltrasoundAssistantScreen({ navigation }: Props) {
  const oradsAtlas = ORADS_NOSOLOGY_ATLAS.filter((item) =>
    ["dermoid_cyst", "hydrosalpinx", "free_fluid_pelvis"].includes(item.id),
  );

  const routes: RouteCard[] = [
    {
      title: "Матка / миома / FIGO",
      subtitle: "Отметка на матке → стенка → тип FIGO → текст протокола",
      badge: "МАТКА",
      color: "#BE123C",
      onPress: () => openClinicalToolAction(navigation, "uterus_clinic"),
    },
    {
      title: "Молочная железа",
      subtitle: "Квадрант → часы → расстояние от соска → BI-RADS",
      badge: "МЖ",
      color: "#9F1239",
      onPress: () => openClinicalToolAction(navigation, "breast_3d"),
    },
    {
      title: "Щитовидная железа",
      subtitle: "Доля → треть → отдел → TI-RADS и показания к ТАБ",
      badge: "ЩЖ",
      color: "#0F766E",
      onPress: () => openClinicalToolAction(navigation, "tirads"),
    },
    {
      title: "Яичники / придатки",
      subtitle: "O-RADS → IOTA → риск → маршрут наблюдения",
      badge: "O-RADS",
      color: "#7C3AED",
      onPress: () => openClinicalToolAction(navigation, "orads"),
    },
    {
      title: "Акушерское УЗИ",
      subtitle: "Срок → фетометрия → допплер → FMF/RU-скрининг",
      badge: "FMF",
      color: "#0369A1",
      onPress: () => openClinicalToolAction(navigation, "fmf"),
    },
    {
      title: "Новый УЗИ-кейс",
      subtitle: "Снимок или видео → описание → разбор с коллегами и AI",
      badge: "КЕЙС",
      color: "#EA580C",
      onPress: () => navigation.navigate("Case", { startAtImage: true }),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.kicker}>AI · УЗИ · протокол</Text>
          <Text style={styles.title}>Помощник врача УЗИ</Text>
          <Text style={styles.sub}>Орган → локализация → классификация → безопасный следующий шаг</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.aiCard} onPress={() => navigation.navigate("Case", { startAtImage: true })}>
          <Text style={styles.aiKicker}>AI-разбор изображения</Text>
          <Text style={styles.aiTitle}>Загрузить снимок УЗИ</Text>
          <Text style={styles.aiSub}>Снимок станет основой кейса: орган, описание, локализация и рабочий протокол.</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрый маршрут</Text>
          <View style={styles.grid}>
            {routes.map((route) => (
              <RouteCardView key={route.title} item={route} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O-RADS эхограммы</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.atlasRow}>
            {oradsAtlas.map((item) => (
              <Pressable key={item.id} style={styles.atlasCard} onPress={() => openClinicalToolAction(navigation, "orads")}>
                <Image source={{ uri: webAppUrl(item.imageSrc) }} style={styles.atlasImage} resizeMode="cover" />
                <View style={styles.atlasText}>
                  <Text style={styles.atlasTitle} numberOfLines={1}>
                    {item.titleRu}
                  </Text>
                  <Text style={styles.atlasHint} numberOfLines={2}>
                    {item.oradsHint}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.protocolBox}>
          <Text style={styles.protocolTitle}>Что должно получиться на приёме</Text>
          <Text style={styles.protocolText}>
            Пример: миома FIGO 4 по передней стенке матки; образование правой МЖ в ВВК на 9 часах,
            4 см (40 мм) от соска; узел правой доли ЩЖ в средней трети латерального отдела.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  backText: { fontSize: 18, fontWeight: "800", color: "#0F2744" },
  headerCenter: { flex: 1 },
  headerSpacer: { width: 40 },
  kicker: { fontSize: 11, fontWeight: "800", color: "#64748B", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 25, fontWeight: "900", color: "#0F2744", marginTop: 3 },
  sub: { fontSize: 13, color: "#5C6B7A", marginTop: 4, lineHeight: 18 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  aiCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#0F2744",
  },
  aiKicker: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.76)", textTransform: "uppercase" },
  aiTitle: { fontSize: 20, fontWeight: "900", color: "#fff", marginTop: 8 },
  aiSub: { fontSize: 13, color: "rgba(255,255,255,0.86)", marginTop: 6, lineHeight: 19 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#475569", textTransform: "uppercase" },
  grid: { gap: 10 },
  routeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    padding: 14,
  },
  routeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeBadge: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  routeTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginTop: 6 },
  routeSub: { fontSize: 13, color: "#64748B", lineHeight: 18, marginTop: 4 },
  atlasRow: { gap: 10, paddingRight: 4 },
  atlasCard: {
    width: 190,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  atlasImage: { width: "100%", height: 118, backgroundColor: "#E2E8F0" },
  atlasText: { padding: 10, gap: 3 },
  atlasTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  atlasHint: { fontSize: 11, color: "#64748B", lineHeight: 15 },
  protocolBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    padding: 14,
  },
  protocolTitle: { fontSize: 13, fontWeight: "900", color: "#0F2744" },
  protocolText: { fontSize: 13, color: "#475569", lineHeight: 19, marginTop: 6 },
});
