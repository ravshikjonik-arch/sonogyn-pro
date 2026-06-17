import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CaseCard from "../components/CaseCard";
import { ClinicalToolSearchBar, PinnedToolsRow } from "../components/clinical/ClinicalToolSearch";
import { branding } from "../config/branding";
import { PRODUCT } from "../config/product";
import { useCases } from "../hooks/useCases";
import { useRecentComments } from "../hooks/useRecentComments";
import { loadDoctorRole, resolvePinnedIds } from "../lib/doctorWorkspacePrefs";
import { openClinicalToolAction } from "../lib/clinical-tools/openClinicalTool";
import type { DoctorRole } from "@repo/clinical-tools";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

export type ChatTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ChatTab">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function CommunityHubScreen({ navigation }: ChatTabScreenProps) {
  const { cases, loading, reload, error } = useCases();
  const { items: recentComments, loading: commentsLoading, reload: reloadComments } = useRecentComments();
  const [role, setRole] = useState<DoctorRole | null>(null);
  const [pins, setPins] = useState<string[]>([]);

  useEffect(() => {
    void loadDoctorRole().then(setRole);
    void resolvePinnedIds(null).then(setPins);
  }, []);

  const sorted = useMemo(
    () => [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [cases],
  );

  const refreshing = loading || commentsLoading;

  const onRefresh = useCallback(() => {
    void reload();
    void reloadComments();
    void resolvePinnedIds(role).then(setPins);
  }, [reload, reloadComments, role]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Ядро {PRODUCT.shortName}</Text>
        <Text style={styles.title}>Чат и кейсы</Text>
        <Text style={styles.sub}>Обсуждения с коллегами · разбор снимков</Text>
      </View>

      <View style={styles.searchBlock}>
        <ClinicalToolSearchBar navigation={navigation} role={role} />
        <PinnedToolsRow navigation={navigation} toolIds={pins.slice(0, 6)} />
      </View>

      <Pressable
        style={styles.chatCta}
        onPress={() => openClinicalToolAction(navigation, "chat_web")}
      >
        <Text style={styles.chatCtaTitle}>Открыть чат врачей</Text>
        <Text style={styles.chatCtaSub}>Live-каналы · гинекология · акушерство · фото УЗИ</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("Case", { caseId: undefined })}>
          <Text style={styles.actionBtnText}>+ Кейс</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtnOutline}
          onPress={() => navigation.navigate("Case", { caseId: undefined, startAtImage: true })}
        >
          <Text style={styles.actionBtnOutlineText}>Фото УЗИ</Text>
        </Pressable>
      </View>

      {loading && sorted.length === 0 ? (
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={branding.colors.primary} />
          }
          ListHeaderComponent={
            recentComments.length > 0 ? (
              <View style={styles.discussBlock}>
                <Text style={styles.sectionLabel}>Свежие комментарии</Text>
                {recentComments.slice(0, 3).map((c) => (
                  <Pressable key={c.id} style={styles.discussRow} onPress={() => navigation.navigate("Case", { caseId: c.caseId })}>
                    <Text style={styles.discussText} numberOfLines={2}>
                      {c.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Кейсов пока нет</Text>
              <Text style={styles.emptyHint}>Создайте кейс или зайдите в чат врачей</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <CaseCard item={item} onPress={() => navigation.navigate("Case", { caseId: item.id })} />
            </View>
          )}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.fab} onPress={() => navigation.navigate("Case", { caseId: undefined })}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6B7C8F", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F2744", marginTop: 4 },
  sub: { fontSize: 14, color: "#5C6B7A", marginTop: 4 },
  searchBlock: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  chatCta: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#059669",
    marginBottom: 10,
  },
  chatCtaTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  chatCtaSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: branding.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  actionBtnOutlineText: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  discussBlock: { marginBottom: 16, paddingHorizontal: 4 },
  discussRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  discussText: { fontSize: 14, color: "#334155" },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  columnWrap: { gap: 12 },
  cell: { flex: 1, maxWidth: "50%" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 24, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155" },
  emptyHint: { fontSize: 13, color: "#64748b", marginTop: 6, textAlign: "center" },
  error: { color: "#b91c1c", padding: 12, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: branding.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
});
