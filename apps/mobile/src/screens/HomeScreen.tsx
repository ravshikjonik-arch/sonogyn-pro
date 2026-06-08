import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CaseCard from "../components/CaseCard";
import { calcClinicalProgress } from "../components/widgets/case_progress";
import { branding } from "../config/branding";
import { openTelegramChannel } from "../config/community";
import type { CasePreview } from "../features/case/types";
import { useCases } from "../hooks/useCases";
import { useRecentComments } from "../hooks/useRecentComments";
import i18n from "../i18n";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type HomeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "HomeTab">,
  NativeStackScreenProps<RootStackParamList>
>;

const PRIMARY = branding.colors.primary;
const PRIMARY_SOFT = "#dbeafe";

function organLabel(o: CasePreview["organ"]): string {
  if (o === "breast") return i18n.t("breast");
  if (o === "ovary") return i18n.t("ovary");
  if (o === "uterus") return i18n.t("uterus");
  return i18n.t("lymph_node");
}

function pickCaseOfDay(cases: CasePreview[]): CasePreview | undefined {
  if (!cases.length) return undefined;
  const sorted = [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const day = Math.floor(Date.now() / 86_400_000);
  return sorted[day % sorted.length];
}

function fmtShort(ts: number): string {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type NavRow = { key: string; title: string; sub: string; glyph: string; onPress: () => void };

export default function HomeScreen({ navigation }: HomeTabScreenProps) {
  const { cases, loading, reload, error } = useCases();
  const { items: recentComments, loading: commentsLoading, reload: reloadComments } = useRecentComments();

  const sorted = useMemo(() => [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [cases]);
  const lastCase = sorted[0];
  const caseOfDay = useMemo(() => pickCaseOfDay(cases), [cases]);
  const lastProgress = lastCase ? calcClinicalProgress(lastCase) : null;

  const onOpenCase = (id: string) => navigation.navigate("Case", { caseId: id });
  const onNewCase = () => navigation.navigate("Case", { caseId: undefined });

  const refreshing = loading || commentsLoading;

  const directions: NavRow[] = useMemo(
    () => [
      {
        key: "elasto",
        title: "Эластография",
        sub: "Strain · Shear Wave · CCI · Tsukuba",
        glyph: "◈",
        onPress: () => navigation.navigate("ElastographyCalc"),
      },
      {
        key: "orads",
        title: "O-RADS + IOTA 2026",
        sub: "Общий калькулятор яичника по O-RADS и новому consensus IOTA",
        glyph: "○",
        onPress: () => navigation.navigate("ORADSPro"),
      },
      {
        key: "tirads",
        title: "TI-RADS",
        sub: "Щитовидная железа · скрининг",
        glyph: "△",
        onPress: () => navigation.navigate("TiRadsAssistant"),
      },
      {
        key: "birads3d",
        title: "Макет МЖ",
        sub: "Часы · см от соска · обе груди",
        glyph: "◈",
        onPress: () => navigation.navigate("Breast3D"),
      },
      {
        key: "birads",
        title: "BI-RADS US",
        sub: "Молочная железа",
        glyph: "◎",
        onPress: () => navigation.navigate("BiRadsAssistant"),
      },
      {
        key: "uterus",
        title: "Матка · FIGO + аденомиоз / ДИЭ",
        sub: "Интерактив FIGO миомы, sono-консенсус аденомиоза и глубокого эндометриоза, общий протокол",
        glyph: "◉",
        onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_uterus_clinic" }),
      },
      {
        key: "fmf",
        title: "FMF / пренатальный скрининг",
        sub: "Сроки, маркеры, чеклисты",
        glyph: "◍",
        onPress: () => navigation.navigate("FMFAssistant"),
      },
      {
        key: "photo",
        title: "Фото УЗИ в кейс",
        sub: "Галерея или камера — вложение в кейс (без авто-диагноза по картинке)",
        glyph: "▣",
        onPress: () => navigation.navigate("Case", { caseId: undefined, startAtImage: true }),
      },
      {
        key: "gyn",
        title: "Гинекология · помощник врача",
        sub: "Гинеколог и акушер: нозологии, УЗИ, красные флаги, протокол",
        glyph: "◐",
        onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_hub" }),
      },
      {
        key: "community",
        title: "Сообщество врачей УЗД",
        sub: "Telegram · @UltraGynAnalytics (при блокировке — VPN)",
        glyph: "✦",
        onPress: () => void openTelegramChannel(),
      },
      {
        key: "orads_flow",
        title: "O-RADS Library",
        sub: "Дерево решений и таблицы",
        glyph: "◇",
        onPress: () => navigation.navigate("ORADSFlow"),
      },
    ],
    [navigation]
  );

  const quickTiles = useMemo(
    () => [
      { key: "q1", label: "O-RADS/IOTA", glyph: "○", onPress: () => navigation.navigate("ORADSPro") },
      { key: "q2", label: "TI-RADS", glyph: "△", onPress: () => navigation.navigate("TiRadsAssistant") },
      { key: "q3", label: "BI-RADS", glyph: "◎", onPress: () => navigation.navigate("BiRadsAssistant") },
      { key: "q_b3d", label: "Макет МЖ", glyph: "◈", onPress: () => navigation.navigate("Breast3D") },
      {
        key: "q_ut",
        label: "Матка",
        glyph: "◉",
        onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_uterus_clinic" }),
      },
      { key: "q4", label: "Фото в кейс", glyph: "▣", onPress: () => navigation.navigate("Case", { caseId: undefined, startAtImage: true }) },
    ],
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroKicker}>SonoGyn Pro</Text>
            <Text style={styles.heroTitle}>Рабочий стол врача</Text>
            <Text style={styles.heroSub}>Калькуляторы · 3D · кейсы · КР</Text>
          </View>
          {branding.pilot.enabled ? (
            <View style={styles.pilotChip}>
              <Text style={styles.pilotChipText}>{branding.pilot.label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.breadcrumb}>
          <Text style={styles.breadcrumbHome}>⌂</Text>
          <Text style={styles.breadcrumbSep}>  ·  </Text>
          <Text style={styles.breadcrumbCurrent}>Рабочий стол</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void reload();
              void reloadComments();
            }}
            tintColor={PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Виджеты</Text>
        <View style={styles.card}>
          {lastCase ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Последний кейс</Text>
                <Text style={styles.cardMeta}>{organLabel(lastCase.organ)}</Text>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {lastCase.description?.trim() || "Без описания"}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${lastProgress?.percent ?? 0}%` }]} />
              </View>
              <Text style={styles.progressCap}>
                Шаги {lastProgress?.completed ?? 0}/{lastProgress?.total ?? 0}
              </Text>
              <Pressable style={styles.pillPrimary} onPress={() => onOpenCase(lastCase.id)}>
                <Text style={styles.pillPrimaryText}>Продолжить</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Нет кейсов</Text>
              <Text style={styles.cardDescMuted}>Создайте кейс для разбора</Text>
              <Pressable style={styles.pillPrimary} onPress={onNewCase}>
                <Text style={styles.pillPrimaryText}>Новый кейс</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.quickWrap}>
          {quickTiles.map((t) => (
            <Pressable key={t.key} style={styles.quickTile} onPress={t.onPress}>
              <Text style={styles.quickGlyph}>{t.glyph}</Text>
              <Text style={styles.quickLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Направления</Text>
        <View style={styles.listCard}>
          {directions.map((d, i) => (
            <Pressable
              key={d.key}
              style={[styles.dirRow, i < directions.length - 1 && styles.dirRowBorder]}
              onPress={d.onPress}
            >
              <View style={styles.dirGlyphWrap}>
                <Text style={styles.dirGlyph}>{d.glyph}</Text>
              </View>
              <View style={styles.dirBody}>
                <Text style={styles.dirTitle}>{d.title}</Text>
                <Text style={styles.dirSub}>{d.sub}</Text>
              </View>
              <Text style={styles.dirChev}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Кейс дня</Text>
        {caseOfDay ? (
          <View style={styles.cotd}>
            <CaseCard item={caseOfDay} onPress={() => onOpenCase(caseOfDay.id)} />
          </View>
        ) : (
          <View style={styles.softEmpty}>
            <Text style={styles.softEmptyText}>Кейсы появятся здесь</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Обсуждения</Text>
        {recentComments.length === 0 && !commentsLoading ? (
          <View style={styles.softEmpty}>
            <Text style={styles.softEmptyText}>Пока нет комментариев</Text>
          </View>
        ) : (
          <View style={styles.discussCard}>
            {recentComments.slice(0, 5).map((c) => (
              <Pressable key={c.id} style={styles.discussRow} onPress={() => onOpenCase(c.caseId)}>
                <View style={styles.discussDot} />
                <View style={styles.discussBody}>
                  <Text style={styles.discussText} numberOfLines={2}>
                    {c.text}
                  </Text>
                  <Text style={styles.discussSub}>
                    {c.caseId.slice(0, 8)}… · {fmtShort(c.createdAt)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void reload()}>
              <Text style={styles.errorLink}>Обновить</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  hero: {
    backgroundColor: PRIMARY,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 6,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroKicker: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.8)", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 4 },
  heroSub: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.88)", marginTop: 6 },
  pilotChip: {
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    maxWidth: "48%",
  },
  pilotChipText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  breadcrumb: { marginTop: 14, flexDirection: "row", alignItems: "center" },
  breadcrumbHome: { fontSize: 14, color: "#fff", fontWeight: "800" },
  breadcrumbSep: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  breadcrumbCurrent: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.95)" },
  scroll: { paddingHorizontal: theme.spacing.md, paddingTop: 18, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionSpacer: { marginTop: 26 },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: PRIMARY },
  cardMeta: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  cardDesc: { fontSize: 14, color: "#475569", marginTop: 8, lineHeight: 20 },
  cardDescMuted: { fontSize: 14, color: "#64748b", marginTop: 6 },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: PRIMARY },
  progressCap: { fontSize: 12, color: "#64748b", marginTop: 8 },
  pillPrimary: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  pillPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  quickTile: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  quickGlyph: { fontSize: 22, color: PRIMARY, fontWeight: "700" },
  quickLabel: { fontSize: 13, fontWeight: "800", color: PRIMARY },
  listCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  dirRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  dirRowBorder: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  dirGlyphWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  dirGlyph: { fontSize: 18, color: PRIMARY, fontWeight: "700" },
  dirBody: { flex: 1, minWidth: 0 },
  dirTitle: { fontSize: 15, fontWeight: "800", color: PRIMARY },
  dirSub: { fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 16 },
  dirChev: { fontSize: 22, color: "#cbd5e1", fontWeight: "300" },
  cotd: { marginHorizontal: -2 },
  softEmpty: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    alignItems: "center",
  },
  softEmptyText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  discussCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  discussRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
    alignItems: "flex-start",
  },
  discussDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: PRIMARY, opacity: 0.35 },
  discussBody: { flex: 1, minWidth: 0 },
  discussText: { fontSize: 14, color: "#0f172a", lineHeight: 20, fontWeight: "500" },
  discussSub: { fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: "600" },
  errorBanner: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: "#b91c1c" },
  errorLink: { fontSize: 13, fontWeight: "700", color: PRIMARY },
});
