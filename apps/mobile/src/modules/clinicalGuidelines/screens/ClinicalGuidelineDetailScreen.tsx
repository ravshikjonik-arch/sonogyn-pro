import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../navigation/paramLists";
import { theme } from "../../../theme";
import { CLINICAL_GUIDELINES, ISSUER_LABELS, SHELF_LABELS, SPECIALTY_LABELS } from "../guidelinesManifest";

type Props = NativeStackScreenProps<RootStackParamList, "ClinicalGuidelineDetail">;

export default function ClinicalGuidelineDetailScreen({ route, navigation }: Props) {
  const { guidelineId } = route.params;
  const g = useMemo(() => CLINICAL_GUIDELINES.find((x) => x.id === guidelineId), [guidelineId]);

  if (!g) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.empty}>КР не найдена</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.back}>← Назад к списку КР</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>
          {SHELF_LABELS[g.shelf]} · {ISSUER_LABELS[g.issuer] ?? g.issuer} · {g.year}
        </Text>
        <Text style={styles.title}>{g.title}</Text>
        <Text style={styles.meta}>{SPECIALTY_LABELS[g.specialty]}</Text>
        <Text style={styles.summary}>{g.summary}</Text>

        {g.sections?.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {sec.bullets.map((b) => (
              <Text key={b} style={styles.bullet}>
                • {b}
              </Text>
            ))}
          </View>
        ))}

        {g.officialUrl ? (
          <Pressable
            style={styles.linkBtn}
            onPress={() => void Linking.openURL(g.officialUrl!)}
            accessibilityRole="link"
          >
            <Text style={styles.linkBtnText}>Официальный документ (PDF/сайт)</Text>
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>
          Выдержки для справки врача. Не заменяют полный текст КР и клиническое решение специалиста. Актуальность
          проверяйте по официальному источнику.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 16 },
  back: { color: "#6D28D9", fontWeight: "600", paddingVertical: 12, fontSize: 15 },
  scroll: { paddingBottom: 40 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 8, lineHeight: 28 },
  meta: { fontSize: 13, color: "#6D28D9", fontWeight: "600", marginTop: 6 },
  summary: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 22 },
  section: { marginTop: 20, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  bullet: { fontSize: 14, color: theme.colors.text, lineHeight: 21, paddingLeft: 4 },
  linkBtn: {
    marginTop: 24,
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  linkBtnText: { color: "#5B21B6", fontWeight: "700", fontSize: 14 },
  disclaimer: { marginTop: 20, fontSize: 11, color: "#94a3b8", lineHeight: 16, fontStyle: "italic" },
  empty: { padding: 24, color: theme.colors.textSecondary },
});
