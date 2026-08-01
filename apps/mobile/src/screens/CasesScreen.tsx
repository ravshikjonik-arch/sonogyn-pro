import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CaseCard from "../components/CaseCard";
import TeachingCaseCard from "../components/TeachingCaseCard";
import { ClinicalToolSearchBar } from "../components/clinical/ClinicalToolSearch";
import { branding } from "../config/branding";
import { PRODUCT } from "../config/product";
import type { TeachingCaseFeedMode } from "../features/teachingCases/types";
import { useCases } from "../hooks/useCases";
import { useDiscussionChannels } from "../hooks/useDiscussionChannels";
import { useTeachingCases } from "../hooks/useTeachingCases";
import { openWebPath } from "../lib/clinical-tools/openClinicalTool";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import { useAppGate } from "../navigation/AppGateContext";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type CasesTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ChatTab">,
  NativeStackScreenProps<RootStackParamList>
>;

const ANON_CHECKS = [
  "На снимках и в тексте нет ФИО, даты рождения, номера карты и ID исследования",
  "Нет названия клиники, врача, телефона и других идентификаторов",
  "Кейс сформулирован как обезличенный клинический вопрос для коллег",
];

export default function CasesScreen({ navigation, route }: CasesTabScreenProps) {
  const { supabaseSession } = useAppGate();
  const userId = supabaseSession?.user.id ?? null;
  const initialSection = route.params?.section;
  const [view, setView] = useState<"local" | "gallery">(
    initialSection === "local" ? "local" : "gallery",
  );
  const [feedMode, setFeedMode] = useState<TeachingCaseFeedMode>(
    initialSection === "discussions" ? "discussions" : initialSection === "gallery" ? "library" : "discussions",
  );
  const [channelId, setChannelId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [questionAnatomy, setQuestionAnatomy] = useState("");
  const [anonChecks, setAnonChecks] = useState<boolean[]>([false, false, false]);
  const [questionBusy, setQuestionBusy] = useState(false);
  const [galleryOrads, setGalleryOrads] = useState<number | undefined>(undefined);
  const [galleryTags, setGalleryTags] = useState("");

  const { channels } = useDiscussionChannels();
  const { cases, loading, reload, error } = useCases();
  const galleryFilters = useMemo(
    () =>
      view === "gallery"
        ? {
            feedMode,
            channelId: feedMode === "discussions" && channelId ? channelId : undefined,
            orads: feedMode === "library" ? galleryOrads : undefined,
            tags: feedMode === "library" && galleryTags.trim() ? galleryTags.trim() : undefined,
          }
        : {},
    [view, feedMode, channelId, galleryOrads, galleryTags],
  );
  const {
    cases: galleryCases,
    loading: galleryLoading,
    reload: reloadGallery,
    error: galleryError,
  } = useTeachingCases(galleryFilters);

  const sorted = useMemo(
    () => [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [cases],
  );
  const showGallery = view === "gallery";
  const activeChannel = channels.find((ch) => ch.id === channelId);

  useEffect(() => {
    const section = route.params?.section;
    if (section === "discussions") {
      setView("gallery");
      setFeedMode("discussions");
    } else if (section === "gallery") {
      setView("gallery");
      setFeedMode("library");
    } else if (section === "local") {
      setView("local");
    }
  }, [route.params?.section]);

  useEffect(() => {
    if (feedMode !== "discussions" || channelId || channels.length === 0) return;
    setChannelId(channels[0]!.id);
  }, [feedMode, channelId, channels]);

  const refreshSubscription = useCallback(async () => {
    if (!supabaseMobile || !userId || !channelId || feedMode !== "discussions") {
      setSubscribed(false);
      return;
    }
    const { data } = await supabaseMobile
      .from("channel_subscriptions")
      .select("user_id")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .maybeSingle();
    setSubscribed(Boolean(data));
  }, [userId, channelId, feedMode]);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  async function toggleChannelSubscription() {
    if (!supabaseMobile || !userId) {
      Alert.alert("Подписка", "Войдите в Supabase, чтобы получать push по разделу.");
      return;
    }
    if (!channelId) {
      Alert.alert("Подписка", "Выберите раздел.");
      return;
    }

    setSubscriptionBusy(true);
    try {
      if (subscribed) {
        const { error: deleteErr } = await supabaseMobile
          .from("channel_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("channel_id", channelId);
        if (deleteErr) throw deleteErr;
        setSubscribed(false);
        Alert.alert("Push", "Подписка на раздел отключена.");
      } else {
        const { error: insertErr } = await supabaseMobile
          .from("channel_subscriptions")
          .insert({ user_id: userId, channel_id: channelId });
        if (insertErr) throw insertErr;
        setSubscribed(true);
        Alert.alert("Push", "Уведомления о новых вопросах в разделе включены.");
      }
    } catch (e) {
      Alert.alert("Подписка", e instanceof Error ? e.message : "Не удалось изменить подписку.");
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function createDiscussionQuestion() {
    if (!supabaseMobile || !userId) {
      Alert.alert("Нужен вход", "Войдите или зарегистрируйтесь, чтобы создать вопрос коллегам.", [
        { text: "Позже", style: "cancel" },
        { text: "Войти", onPress: () => navigation.navigate("SupabaseAuth") },
      ]);
      return;
    }
    if (!channelId) {
      Alert.alert("Выберите раздел", "Например: O-RADS, гинекология, акушерство, МЖ.");
      return;
    }
    if (!questionTitle.trim()) {
      Alert.alert("Заголовок", "Коротко напишите, что обсуждаем.");
      return;
    }
    if (!questionBody.trim()) {
      Alert.alert("Клинический вопрос", "Добавьте описание находки и что хотите уточнить у коллег.");
      return;
    }
    if (!anonChecks.every(Boolean)) {
      Alert.alert("Анонимизация", "Подтвердите все пункты перед публикацией вопроса.");
      return;
    }

    setQuestionBusy(true);
    try {
      const active = channels.find((ch) => ch.id === channelId);
      const { data, error: insertError } = await supabaseMobile
        .from("cases")
        .insert({
          user_id: userId,
          title: questionTitle.trim(),
          description: questionBody.trim(),
          anatomy: questionAnatomy.trim() || active?.title || null,
          pathology: null,
          difficulty: "discussion",
          status: "published",
          is_public: true,
          channel_id: channelId,
          tags: ["discussion", active?.slug ?? "doctor-chat"].filter(Boolean),
        })
        .select("id")
        .single();

      if (insertError || !data?.id) {
        throw new Error(insertError?.message ?? "Не удалось создать вопрос.");
      }

      setQuestionTitle("");
      setQuestionBody("");
      setQuestionAnatomy("");
      setAnonChecks([false, false, false]);
      setQuestionOpen(false);
      await reloadGallery();
      Alert.alert("Вопрос опубликован", "Коллеги увидят его в выбранном разделе чата.", [
        { text: "Открыть", onPress: () => void openWebPath(`/cases/${data.id}`) },
        { text: "ОК" },
      ]);
    } catch (e) {
      Alert.alert("Чат врачей", e instanceof Error ? e.message : "Не удалось создать вопрос.");
    } finally {
      setQuestionBusy(false);
    }
  }

  const galleryHeader = showGallery ? (
    <View style={styles.galleryControls}>
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, feedMode === "library" && styles.segmentBtnActive]}
          onPress={() => setFeedMode("library")}
        >
          <Text style={[styles.segmentText, feedMode === "library" && styles.segmentTextActive]}>
            Библиотека
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, feedMode === "discussions" && styles.segmentBtnActive]}
          onPress={() => setFeedMode("discussions")}
        >
          <Text style={[styles.segmentText, feedMode === "discussions" && styles.segmentTextActive]}>
            Вопросы коллегам
          </Text>
        </Pressable>
      </View>

      {feedMode === "library" ? (
        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>O-RADS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelRow}>
            <Pressable
              style={[styles.channelChip, galleryOrads === undefined && styles.channelChipActive]}
              onPress={() => setGalleryOrads(undefined)}
            >
              <Text style={[styles.channelChipText, galleryOrads === undefined && styles.channelChipTextActive]}>
                Все
              </Text>
            </Pressable>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                style={[styles.channelChip, galleryOrads === n && styles.channelChipActive]}
                onPress={() => setGalleryOrads(n)}
              >
                <Text style={[styles.channelChipText, galleryOrads === n && styles.channelChipTextActive]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            placeholder="Теги: cystic, adnexa"
            placeholderTextColor="#94a3b8"
            value={galleryTags}
            onChangeText={setGalleryTags}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}

      {feedMode === "discussions" ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelRow}>
            {channels.map((ch) => (
              <Pressable
                key={ch.id}
                style={[styles.channelChip, channelId === ch.id && styles.channelChipActive]}
                onPress={() => setChannelId(ch.id)}
              >
                <Text style={[styles.channelChipText, channelId === ch.id && styles.channelChipTextActive]}>
                  {ch.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {channelId ? (
            <Pressable
              style={[styles.pushBtn, subscribed && styles.pushBtnActive]}
              disabled={subscriptionBusy}
              onPress={() => void toggleChannelSubscription()}
            >
              <Text style={[styles.pushBtnText, subscribed && styles.pushBtnTextActive]}>
                {subscriptionBusy
                  ? "…"
                  : subscribed
                    ? `Push · ${activeChannel?.title ?? "раздел"} ✓`
                    : `Push · ${activeChannel?.title ?? "раздел"}`}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <Pressable
        style={styles.newQuestionBtn}
        onPress={() => {
          if (feedMode === "discussions") setQuestionOpen((v) => !v);
          else navigation.navigate("Case", { caseId: undefined });
        }}
      >
        <Text style={styles.newQuestionBtnText}>
          {feedMode === "discussions" ? "Новый вопрос коллегам" : "Новый учебный кейс"}
        </Text>
      </Pressable>

      {feedMode === "discussions" && questionOpen ? (
        <View style={styles.questionForm}>
          <Text style={styles.questionFormTitle}>Вопрос коллегам</Text>
          <TextInput
            style={styles.input}
            placeholder="Заголовок: O-RADS 3 или 4?"
            placeholderTextColor="#94a3b8"
            value={questionTitle}
            onChangeText={setQuestionTitle}
          />
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="Описание без персональных данных: находка, сомнение, что нужно обсудить..."
            placeholderTextColor="#94a3b8"
            value={questionBody}
            onChangeText={setQuestionBody}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Зона: яичники / матка / акушерство / МЖ"
            placeholderTextColor="#94a3b8"
            value={questionAnatomy}
            onChangeText={setQuestionAnatomy}
          />
          <View style={styles.anonBox}>
            <Text style={styles.anonTitle}>Перед публикацией</Text>
            {ANON_CHECKS.map((label, index) => (
              <Pressable
                key={label}
                style={styles.anonRow}
                onPress={() =>
                  setAnonChecks((prev) => {
                    const next = [...prev];
                    next[index] = !next[index];
                    return next;
                  })
                }
              >
                <View style={[styles.checkbox, anonChecks[index] && styles.checkboxActive]}>
                  <Text style={styles.checkboxText}>{anonChecks[index] ? "✓" : ""}</Text>
                </View>
                <Text style={styles.anonText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.questionActions}>
            <Pressable
              style={styles.cancelBtn}
              disabled={questionBusy}
              onPress={() => setQuestionOpen(false)}
            >
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </Pressable>
            <Pressable
              style={[styles.publishBtn, questionBusy && styles.publishBtnDisabled]}
              disabled={questionBusy}
              onPress={() => void createDiscussionQuestion()}
            >
              <Text style={styles.publishBtnText}>{questionBusy ? "Публикую..." : "Опубликовать"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Ядро {PRODUCT.shortName}</Text>
        <Text style={styles.title}>Чат и кейсы</Text>
        <Text style={styles.sub}>Обсуждения с коллегами · разбор снимков</Text>
        <View style={styles.searchBlock}>
          <ClinicalToolSearchBar navigation={navigation} placeholder="Что искать? O-RADS, чат, цитология…" />
        </View>
        <Pressable
          style={styles.chatCta}
          onPress={() => {
            setView("gallery");
            setFeedMode("discussions");
          }}
        >
          <Text style={styles.chatCtaTitle}>Чат врачей · вопросы коллегам</Text>
          <Text style={styles.chatCtaSub}>Разделы по специальности · push · без браузера</Text>
        </Pressable>
        {!userId ? (
          <Pressable style={styles.loginNotice} onPress={() => navigation.navigate("SupabaseAuth")}>
            <Text style={styles.loginNoticeTitle}>Для публикации нужен вход</Text>
            <Text style={styles.loginNoticeSub}>Читать ленту можно, но вопрос коллегам публикуется только от аккаунта врача.</Text>
          </Pressable>
        ) : null}
        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentBtn, view === "local" && styles.segmentBtnActive]}
            onPress={() => setView("local")}
          >
            <Text style={[styles.segmentText, view === "local" && styles.segmentTextActive]}>Мои кейсы</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, view === "gallery" && styles.segmentBtnActive]}
            onPress={() => setView("gallery")}
          >
            <Text style={[styles.segmentText, view === "gallery" && styles.segmentTextActive]}>
              Галерея / чат
            </Text>
          </Pressable>
        </View>
      </View>

      {showGallery ? (
        galleryLoading && galleryCases.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={branding.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={galleryCases}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={galleryHeader}
            refreshControl={
              <RefreshControl
                refreshing={galleryLoading}
                onRefresh={reloadGallery}
                tintColor={branding.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  {feedMode === "discussions" ? "Вопросов пока нет" : "Галерея пуста"}
                </Text>
                <Text style={styles.emptyHint}>
                  {feedMode === "discussions"
                    ? "Создайте вопрос в выбранном разделе — коллеги увидят его на web и в push."
                    : "Опубликованные учебные кейсы появятся здесь после входа и синхронизации с web."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TeachingCaseCard
                item={item}
                onPress={() => void openWebPath(`/cases/${item.id}`)}
              />
            )}
          />
        )
      ) : loading && sorted.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={branding.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={branding.colors.primary} />
          }
          ListHeaderComponent={
            <Pressable
              style={styles.photoBanner}
              onPress={() => navigation.navigate("Case", { caseId: undefined, startAtImage: true })}
            >
              <Text style={styles.photoBannerTitle}>Фото УЗИ в новый кейс</Text>
              <Text style={styles.photoBannerSub}>Сразу шаг загрузки снимка · галерея или камера</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Нет кейсов</Text>
              <Text style={styles.emptyHint}>Создайте кейс — появится в ленте и в обсуждениях</Text>
              <Pressable
                style={styles.cta}
                onPress={() => navigation.navigate("Case", { caseId: undefined })}
              >
                <Text style={styles.ctaText}>Новый кейс</Text>
              </Pressable>
              <Pressable
                style={styles.ctaSecondary}
                onPress={() => navigation.navigate("Case", { caseId: undefined, startAtImage: true })}
              >
                <Text style={styles.ctaSecondaryText}>Сначала фото УЗИ</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <CaseCard item={item} onPress={() => navigation.navigate("Case", { caseId: item.id })} />
            </View>
          )}
        />
      )}

      {!showGallery ? (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate("Case", { caseId: undefined })}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}

      {showGallery && galleryError ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{galleryError}</Text>
        </View>
      ) : null}

      {!showGallery && error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingBottom: 12 },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: { fontSize: 26, fontWeight: "700", color: branding.colors.text, marginTop: 4 },
  sub: { fontSize: 14, color: branding.colors.textSecondary, marginTop: 4 },
  searchBlock: { marginTop: 10, marginBottom: 10 },
  chatCta: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#059669",
    marginBottom: 10,
  },
  chatCtaTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },
  chatCtaSub: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 4, lineHeight: 17 },
  loginNotice: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    marginBottom: 10,
  },
  loginNoticeTitle: { color: "#9a3412", fontSize: 14, fontWeight: "900" },
  loginNoticeSub: { color: "#9a3412", fontSize: 12, marginTop: 4, lineHeight: 17 },
  segment: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#fff",
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: branding.colors.textSecondary },
  segmentTextActive: { color: branding.colors.text },
  galleryControls: { gap: 12, marginBottom: 8 },
  filterBlock: { gap: 8 },
  filterLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.6 },
  channelRow: { gap: 8, paddingVertical: 2 },
  channelChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  channelChipActive: {
    borderColor: branding.colors.primary,
    backgroundColor: "#eff6ff",
  },
  channelChipText: { fontSize: 12, fontWeight: "600", color: branding.colors.textSecondary },
  channelChipTextActive: { color: branding.colors.primary },
  pushBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: branding.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pushBtnActive: {
    backgroundColor: branding.colors.primary,
  },
  pushBtnText: { fontSize: 12, fontWeight: "700", color: branding.colors.primary },
  pushBtnTextActive: { color: "#fff" },
  newQuestionBtn: {
    alignSelf: "flex-start",
    backgroundColor: branding.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newQuestionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  questionForm: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  questionFormTitle: { fontSize: 15, fontWeight: "900", color: branding.colors.text },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    color: branding.colors.text,
    fontSize: 14,
  },
  inputMulti: { minHeight: 96, textAlignVertical: "top" },
  anonBox: {
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 10,
  },
  anonTitle: { fontSize: 12, fontWeight: "900", color: "#475569" },
  anonRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: { backgroundColor: branding.colors.primary, borderColor: branding.colors.primary },
  checkboxText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  anonText: { flex: 1, fontSize: 12, color: branding.colors.textSecondary, lineHeight: 17 },
  questionActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: { color: branding.colors.text, fontSize: 13, fontWeight: "800" },
  publishBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: branding.colors.primary,
  },
  publishBtnDisabled: { opacity: 0.55 },
  publishBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  listContent: { paddingHorizontal: theme.spacing.md, paddingBottom: 100, gap: 12 },
  columnWrap: { gap: 12 },
  cell: { flex: 1, maxWidth: "50%" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
    maxWidth: 320,
    alignSelf: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: branding.colors.text },
  emptyHint: { fontSize: 14, color: branding.colors.textSecondary, textAlign: "center", lineHeight: 20 },
  cta: {
    marginTop: 8,
    backgroundColor: branding.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  ctaSecondary: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: branding.colors.primary,
    backgroundColor: "#fff",
  },
  ctaSecondaryText: { color: branding.colors.primary, fontWeight: "800", fontSize: 15 },
  photoBanner: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  photoBannerTitle: { fontSize: 15, fontWeight: "800", color: branding.colors.text },
  photoBannerSub: { fontSize: 13, color: branding.colors.textSecondary, marginTop: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: branding.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
  error: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 96,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  errorText: { color: "#b91c1c", fontSize: 12, textAlign: "center" },
});
