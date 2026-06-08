import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
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
import { branding } from "../config/branding";
import { useCases } from "../hooks/useCases";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type CasesTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CasesTab">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function CasesScreen({ navigation }: CasesTabScreenProps) {
  const { cases, loading, reload, error } = useCases();
  const sorted = useMemo(
    () => [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [cases]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Клиника</Text>
        <Text style={styles.title}>Cases</Text>
        <Text style={styles.sub}>Кейсы и обсуждения</Text>
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

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("Case", { caseId: undefined })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {error ? (
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
