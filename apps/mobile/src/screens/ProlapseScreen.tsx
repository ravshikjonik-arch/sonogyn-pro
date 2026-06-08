import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FunctionalCalculator from "../components/prolapse/FunctionalCalculator";
import POPQCalculator from "../components/prolapse/POPQCalculator";
import QuickAssessment from "../components/prolapse/QuickAssessment";
import type { OrganType } from "../features/case/types";
import type { POPQPointKey, QuickStage } from "../gynecology/prolapseLogic";
import {
  computeFunctionalProlapsePercent,
  computePOPQStage,
  parsePOPQFields,
} from "../gynecology/prolapseLogic";
import { popqStageLabel } from "../gynecology/prolapseStageLabel";
import i18n from "../i18n";
import type { RootStackParamList } from "../navigation/AppStack";
import { appendProlapseHistory, loadProlapseHistory, type ProlapseHistoryEntry } from "../services/prolapseHistory";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Prolapse">;

function emptyPopq(): Record<POPQPointKey, string> {
  return { Aa: "", Ba: "", Ap: "", Bp: "", C: "", D: "", GH: "", PB: "", TVL: "" };
}

type TabId = "quick" | "popq" | "functional";

export default function ProlapseScreen({ navigation }: Props) {
  const [tab, setTab] = useState<TabId>("quick");
  const [quickStage, setQuickStage] = useState<QuickStage | null>(null);
  const [popq, setPopq] = useState(emptyPopq);
  const [vRest, setVRest] = useState("");
  const [vValsalva, setVValsalva] = useState("");
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [history, setHistory] = useState<ProlapseHistoryEntry[]>([]);

  const reloadHistory = useCallback(async () => {
    setHistory(await loadProlapseHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadHistory();
    }, [reloadHistory])
  );

  const parsedPopq = useMemo(() => parsePOPQFields(popq), [popq]);
  const popqComputed = useMemo(() => computePOPQStage(parsedPopq), [parsedPopq]);
  const fnPct = useMemo(() => {
    const r = Number(vRest.replace(",", "."));
    const v = Number(vValsalva.replace(",", "."));
    return computeFunctionalProlapsePercent(r, v);
  }, [vRest, vValsalva]);

  const summaryQuick = quickStage == null ? "—" : i18n.t("prolapse_quick_line", { stage: quickStage });
  const summaryPopq = popqStageLabel(popqComputed.stageKey);
  const summaryFn =
    fnPct == null ? "—" : i18n.t("prolapse_functional_line", { pct: Math.round(fnPct * 10) / 10 });

  const fullTextReport = useMemo(() => {
    const lines = [
      summaryQuick !== "—" ? summaryQuick : null,
      summaryPopq !== "—" ? summaryPopq : null,
      summaryFn !== "—" ? summaryFn : null,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }, [summaryQuick, summaryPopq, summaryFn]);

  const draftResultCategory = useMemo(() => {
    if (popqComputed.stageKey !== "na") return popqStageLabel(popqComputed.stageKey);
    if (quickStage != null) return i18n.t("prolapse_quick_line", { stage: quickStage });
    return undefined;
  }, [popqComputed.stageKey, quickStage]);

  function setPopqField(k: POPQPointKey, v: string) {
    setPopq((p) => ({ ...p, [k]: v }));
  }

  function clearAll() {
    setQuickStage(null);
    setPopq(emptyPopq());
    setVRest("");
    setVValsalva("");
  }

  async function saveAsCase() {
    const desc =
      fullTextReport.trim() ||
      [i18n.t("prolapse_screen_title"), new Date().toISOString().slice(0, 10)].join(" — ");
    navigation.navigate("Case", {
      caseId: undefined,
      draftDescription: desc,
      draftOrgan: "uterus" as OrganType,
      draftResultCategory: draftResultCategory,
      draftTimestamp: Date.now(),
    });
  }

  async function addToHistory() {
    const text = fullTextReport.trim();
    if (!text) {
      Alert.alert(i18n.t("prolapse_history_empty_title"), i18n.t("prolapse_history_empty_body"));
      return;
    }
    await appendProlapseHistory(text);
    await reloadHistory();
    Alert.alert(i18n.t("success"), i18n.t("prolapse_history_saved"));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.back, pressed && styles.pressed]} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{i18n.t("back")}</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{i18n.t("prolapse_screen_title")}</Text>
          <Pressable
            hitSlop={12}
            onPress={() => setDisclaimerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("prolapse_disclaimer_a11y")}
          >
            <Text style={styles.infoIcon}>ⓘ</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{i18n.t("prolapse_summary_title")}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{i18n.t("prolapse_summary_quick")}</Text>
            <Text style={styles.summaryVal}>{summaryQuick}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{i18n.t("prolapse_summary_popq")}</Text>
            <Text style={styles.summaryVal}>{summaryPopq}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{i18n.t("prolapse_summary_functional")}</Text>
            <Text style={styles.summaryVal}>{summaryFn}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(
            [
              ["quick", "prolapse_tab_quick"],
              ["popq", "prolapse_tab_popq"],
              ["functional", "prolapse_tab_functional"],
            ] as const
          ).map(([id, labelKey]) => (
            <Pressable
              key={id}
              style={({ pressed }) => [styles.tab, tab === id && styles.tabOn, pressed && styles.pressed]}
              onPress={() => setTab(id)}
            >
              <Text style={[styles.tabText, tab === id && styles.tabTextOn]} numberOfLines={1}>
                {i18n.t(labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          {tab === "quick" ? (
            <QuickAssessment value={quickStage} onChange={setQuickStage} />
          ) : tab === "popq" ? (
            <POPQCalculator values={popq} onChange={setPopqField} />
          ) : (
            <FunctionalCalculator
              vRest={vRest}
              vValsalva={vValsalva}
              onChangeRest={setVRest}
              onChangeValsalva={setVValsalva}
            />
          )}
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]} onPress={clearAll}>
            <Text style={styles.btnGhostText}>{i18n.t("prolapse_clear")}</Text>
          </Pressable>
        </View>

        <View style={styles.rowBtns}>
          <Pressable style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]} onPress={saveAsCase}>
            <Text style={styles.btnPrimaryText}>{i18n.t("prolapse_save_case")}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]} onPress={addToHistory}>
            <Text style={styles.btnSecondaryText}>{i18n.t("prolapse_add_history")}</Text>
          </Pressable>
        </View>

        {history.length > 0 ? (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>{i18n.t("prolapse_history_recent")}</Text>
            {history.slice(0, 6).map((h) => (
              <View key={h.id} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(h.at).toLocaleString(i18n.locale === "ru" ? "ru-RU" : i18n.locale === "es" ? "es" : "en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Text>
                <Text style={styles.historyText}>{h.summary}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={disclaimerOpen} transparent animationType="fade" onRequestClose={() => setDisclaimerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDisclaimerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{i18n.t("prolapse_disclaimer_title")}</Text>
            <Text style={styles.modalBody}>{i18n.t("prolapse_disclaimer_body")}</Text>
            <Pressable style={styles.modalBtn} onPress={() => setDisclaimerOpen(false)}>
              <Text style={styles.modalBtnText}>{i18n.t("continue")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { paddingHorizontal: theme.spacing.md, paddingTop: 8, paddingBottom: 4, gap: 6 },
  back: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: theme.colors.primary, fontWeight: "700", fontSize: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: theme.colors.text },
  infoIcon: { fontSize: 22, color: theme.colors.primary },
  pressed: { opacity: 0.9 },
  scroll: { padding: theme.spacing.md, paddingBottom: 32, gap: theme.spacing.md },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    gap: 10,
  },
  summaryTitle: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary, letterSpacing: 0.5 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  summaryKey: { fontSize: 13, color: theme.colors.textSecondary, flexShrink: 0 },
  summaryVal: { fontSize: 15, fontWeight: "700", color: theme.colors.text, flex: 1, textAlign: "right" },
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
  },
  tabOn: { borderColor: theme.colors.primary, backgroundColor: "#E8F2FC" },
  tabText: { fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, textAlign: "center" },
  tabTextOn: { color: theme.colors.primary },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  btnGhost: { paddingVertical: 10, paddingHorizontal: 14 },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 15 },
  rowBtns: { flexDirection: "column", gap: 10 },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnSecondary: {
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: theme.colors.primary, fontWeight: "800", fontSize: 16 },
  history: { gap: 8 },
  historyTitle: { fontSize: 13, fontWeight: "800", color: theme.colors.textSecondary },
  historyItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyDate: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 },
  historyText: { fontSize: 13, color: theme.colors.text, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.text },
  modalBody: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary },
  modalBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "800" },
});
