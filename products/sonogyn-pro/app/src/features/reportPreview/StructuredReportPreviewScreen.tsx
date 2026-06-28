import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

import type { RootStackParamList } from "../../navigation/paramLists";
import {
  blocksToPlainText,
  buildStructuredReportFromOradsWizard,
  displayBlocks,
} from "../../reporting/buildStructuredReport";
import { exportReportPdf } from "../../reporting/exportReportPdf";
import { SRE_DRAFT_STORAGE_KEY, type SreDraftCache } from "../../reporting/sreDraftStorage";

type Props = NativeStackScreenProps<RootStackParamList, "StructuredReportPreview">;

export default function StructuredReportPreviewScreen({ navigation, route }: Props) {
  const { path, result, pathSummary } = route.params;

  const baseDocument = useMemo(
    () => buildStructuredReportFromOradsWizard(path, result, pathSummary),
    [path, result, pathSummary],
  );

  const [blocks, setBlocks] = useState(() => displayBlocks(baseDocument));
  const [busy, setBusy] = useState<"pdf" | "cache" | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(SRE_DRAFT_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const cached = JSON.parse(raw) as SreDraftCache;
        if (cached.templateSlug === "adnex-orads-v1") {
          setBlocks({
            description: cached.description,
            impression: cached.impression,
            recommendations: cached.recommendations,
          });
        }
      } catch {
        /* ignore corrupt cache */
      }
    });
  }, []);

  async function copyAll() {
    await Clipboard.setStringAsync(blocksToPlainText(blocks));
  }

  async function sharePdf() {
    setBusy("pdf");
    try {
      await exportReportPdf({
        title: "Протокол УЗИ · придатки O-RADS",
        bodyText: blocksToPlainText(blocks),
      });
    } catch (err) {
      console.warn("[SRE] PDF export failed", err);
    } finally {
      setBusy(null);
    }
  }

  async function cacheDraft() {
    setBusy("cache");
    try {
      const payload: SreDraftCache = {
        description: blocks.description,
        impression: blocks.impression,
        recommendations: blocks.recommendations,
        templateSlug: "adnex-orads-v1",
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SRE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.title}>Структурированный протокол</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>{result.category}</Text>
        <Text style={styles.subtitle}>
          O-RADS US · три блока. Не диагноз; интерпретация — лечащий специалист.
        </Text>

        <BlockEditor
          label="Описание"
          value={blocks.description}
          onChange={(description) => setBlocks((b) => ({ ...b, description }))}
        />
        <BlockEditor
          label="Заключение"
          value={blocks.impression}
          onChange={(impression) => setBlocks((b) => ({ ...b, impression }))}
        />
        <BlockEditor
          label="Рекомендации"
          value={blocks.recommendations}
          onChange={(recommendations) => setBlocks((b) => ({ ...b, recommendations }))}
        />

        {baseDocument.output.citations.length > 0 ? (
          <View style={styles.citeBox}>
            <Text style={styles.citeTitle}>Стандарты</Text>
            {baseDocument.output.citations.map((c) => (
              <Text key={c.id} style={styles.citeLine}>
                • {c.label}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => void copyAll()}>
            <Text style={styles.secondaryText}>Копировать</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => void cacheDraft()} disabled={busy !== null}>
            {busy === "cache" ? (
              <ActivityIndicator color="#334155" />
            ) : (
              <Text style={styles.secondaryText}>Кэш offline</Text>
            )}
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => void sharePdf()} disabled={busy !== null}>
            {busy === "pdf" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>PDF / Поделиться</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        multiline
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { color: "#2563EB", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  headerSpacer: { width: 56 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subtitle: { color: "#64748b", fontSize: 12, lineHeight: 17, marginBottom: 4 },
  block: { gap: 6 },
  blockLabel: { fontWeight: "800", color: "#0f172a", fontSize: 14 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
  },
  citeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    padding: 12,
    gap: 4,
  },
  citeTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  citeLine: { color: "#475569", fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  secondaryBtn: {
    flexGrow: 1,
    minWidth: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#334155", fontWeight: "700" },
  primaryBtn: {
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
});
