import type { CytologyTopicId } from "@repo/cervix-pathology-reference/cytology";
import { getCytologyDashboardTopics, getCytologyModuleMeta } from "@repo/cervix-pathology-reference/cytology";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/paramLists";
import { DisclaimerBanner } from "./components/DisclaimerBanner";
import { TopicContent } from "./TopicContent";
import { useCervixTheme } from "./useCervixTheme";

type Props = NativeStackScreenProps<RootStackParamList, "CervixCytologyModule">;

type DisplayTopic = {
  id: string;
  title: string;
  summary: string;
  topicId: CytologyTopicId;
  subFocus?: "thinprep" | "surepath";
};

const EXTRA_TOPICS: DisplayTopic[] = [
  {
    id: "thinprep",
    title: "Hologic ThinPrep",
    summary: "Фильтрация на мембране · 20 мл виала",
    topicId: "liquid-cytology",
    subFocus: "thinprep",
  },
  {
    id: "surepath",
    title: "BD SurePath",
    summary: "Осаждение · 10 мл · щётка в виале",
    topicId: "liquid-cytology",
    subFocus: "surepath",
  },
];

function buildTopics(): DisplayTopic[] {
  const base = getCytologyDashboardTopics().map((t) => ({
    id: t.id,
    title: t.title,
    summary: t.summary,
    topicId: t.id,
  }));
  const liquidIdx = base.findIndex((t) => t.topicId === "liquid-cytology");
  if (liquidIdx >= 0) {
    return [...base.slice(0, liquidIdx + 1), ...EXTRA_TOPICS, ...base.slice(liquidIdx + 1)];
  }
  return [...base, ...EXTRA_TOPICS];
}

export default function CervixCytologyScreen({ navigation, route }: Props) {
  const theme = useCervixTheme();
  const meta = getCytologyModuleMeta();
  const allTopics = useMemo(() => buildTopics(), []);

  const [topicId, setTopicId] = useState<CytologyTopicId | null>(route.params?.topic ?? null);
  const [subFocus, setSubFocus] = useState<"thinprep" | "surepath" | undefined>(route.params?.subFocus);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (route.params?.topic) {
      setTopicId(route.params.topic);
      setSubFocus(route.params.subFocus);
    }
  }, [route.params?.topic, route.params?.subFocus]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTopics;
    return allTopics.filter(
      (t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q),
    );
  }, [allTopics, search]);

  const activeTitle =
    allTopics.find((t) => t.topicId === topicId && t.subFocus === subFocus)?.title ??
    allTopics.find((t) => t.topicId === topicId)?.title ??
    meta.title;

  function openTopic(t: DisplayTopic) {
    setTopicId(t.topicId);
    setSubFocus(t.subFocus);
  }

  function goBack() {
    if (topicId) {
      setTopicId(null);
      setSubFocus(undefined);
      return;
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Pressable style={[styles.back, { borderColor: theme.colors.border }]} onPress={goBack} hitSlop={12}>
          <Text style={[styles.backText, { color: theme.colors.text }]}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>Шейка матки · образование</Text>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {topicId ? activeTitle : meta.title}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <DisclaimerBanner text={meta.disclaimer} theme={theme} />

        {topicId ? (
          <TopicContent topic={topicId} subFocus={subFocus} theme={theme} />
        ) : (
          <>
            <TextInput
              style={[
                styles.search,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
              placeholder="Поиск по модулю: Bethesda, ThinPrep, HPV…"
              placeholderTextColor={theme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            <View style={styles.grid}>
              {filtered.map((t) => (
                <Pressable
                  key={`${t.id}-${t.subFocus ?? ""}`}
                  style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => openTopic(t)}
                >
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t.title}</Text>
                  <Text style={[styles.cardSub, { color: theme.colors.textMuted }]} numberOfLines={3}>
                    {t.summary}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filtered.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: 12 }}>
                Ничего не найдено
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18, fontWeight: "700" },
  headerCenter: { flex: 1, paddingHorizontal: 8 },
  headerSpacer: { width: 40 },
  kicker: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  body: { padding: 16, paddingBottom: 32 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    flexGrow: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", lineHeight: 18 },
  cardSub: { fontSize: 12, lineHeight: 16, marginTop: 6 },
});
