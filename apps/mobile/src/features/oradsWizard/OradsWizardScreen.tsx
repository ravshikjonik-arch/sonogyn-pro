import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useReducer } from "react";
import {
  Animated,
  I18nManager,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  buildOradsPathSummary,
  getOradsDecisionNode,
  getOradsReferat,
  getReferatCaseIdForImageRef,
  getReferatSectionIdForWizardNode,
  ORADS_TREE_OPTIONAL_ENTRY_ID,
  type OradsTreePathStep,
  type OradsTreeResult,
} from "@repo/orads-us";

import type { RootStackParamList } from "../../navigation/paramLists";
import { getWebApiBase } from "../../api/chatBackend";
import OradsAtlasImage from "./OradsAtlasImage";
import OradsOptionCard from "./OradsOptionCard";
import OradsWizardProgress from "./OradsWizardProgress";
import OradsWizardResultPanel from "./OradsWizardResultPanel";
import { resolveOradsAtlasPreview } from "./resolveOradsAtlas";
import { useOradsLocaleStrings } from "./useOradsLocale";
import { appendOradsWizardStep, resolveOradsWizardView } from "./wizardState";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSWizard">;

type WizardState = {
  path: OradsTreePathStep[];
  showTechnicalGate: boolean;
  modifierMode: boolean;
  overrideResult: OradsTreeResult | null;
};

type WizardAction =
  | { type: "pick"; nodeId: string; optionId: string }
  | { type: "back" }
  | { type: "restart" }
  | { type: "modifier_start" }
  | { type: "modifier_pick"; optionId: string };

const ESTIMATED_STEPS = 6;

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "pick": {
      if (state.showTechnicalGate && action.nodeId === ORADS_TREE_OPTIONAL_ENTRY_ID) {
        if (action.optionId === "adequate") {
          return { ...state, showTechnicalGate: false };
        }
        return { ...state, showTechnicalGate: false, path: appendOradsWizardStep(state.path, action.nodeId, action.optionId) };
      }
      if (state.modifierMode) {
        const node = getOradsDecisionNode("step_modifier_ascites");
        const opt = node?.options.find((o) => o.id === action.optionId);
        if (opt?.result) {
          return { ...state, modifierMode: false, overrideResult: opt.result };
        }
        return state;
      }
      return { ...state, path: appendOradsWizardStep(state.path, action.nodeId, action.optionId) };
    }
    case "back": {
      if (state.overrideResult) return { ...state, overrideResult: null };
      if (state.modifierMode) return { ...state, modifierMode: false };
      if (state.path.length === 0) return state;
      return { ...state, path: state.path.slice(0, -1) };
    }
    case "restart":
      return { path: [], showTechnicalGate: true, modifierMode: false, overrideResult: null };
    case "modifier_start":
      return { ...state, modifierMode: true, overrideResult: null };
    case "modifier_pick": {
      const node = getOradsDecisionNode("step_modifier_ascites");
      const opt = node?.options.find((o) => o.id === action.optionId);
      if (opt?.result) {
        return { ...state, modifierMode: false, overrideResult: opt.result };
      }
      return state;
    }
    default:
      return state;
  }
}

export default function OradsWizardScreen({ navigation }: Props) {
  const locale = useOradsLocaleStrings();
  const [state, dispatch] = useReducer(wizardReducer, {
    path: [],
    showTechnicalGate: true,
    modifierMode: false,
    overrideResult: null,
  });

  const view = useMemo(() => {
    if (state.overrideResult) {
      return { kind: "result" as const, result: state.overrideResult, stepIndex: state.path.length + 1 };
    }
    if (state.modifierMode) {
      const node = getOradsDecisionNode("step_modifier_ascites");
      if (node) return { kind: "question" as const, node, stepIndex: state.path.length + 1 };
    }
    if (state.showTechnicalGate) {
      const node = getOradsDecisionNode(ORADS_TREE_OPTIONAL_ENTRY_ID);
      if (node) return { kind: "question" as const, node, stepIndex: 1 };
    }
    return resolveOradsWizardView(state.path);
  }, [state]);

  const pathSummary = useMemo(
    () => buildOradsPathSummary(state.path, (key) => locale.t(key)),
    [state.path, locale],
  );

  const atlasPreview = useMemo(() => {
    if (view.kind !== "question") return null;
    return resolveOradsAtlasPreview(view.node.imageRef);
  }, [view]);

  const rtl = locale.rtl || I18nManager.isRTL;
  const rowDirection = rtl ? "row-reverse" : "row";

  function goBack() {
    if (state.path.length === 0 && !state.overrideResult && !state.modifierMode) {
      navigation.goBack();
      return;
    }
    dispatch({ type: "back" });
  }

  function openAtlasWeb() {
    const base = getWebApiBase();
    if (!base) return;
    navigation.navigate("ORADSGuide");
  }

  function openReferatHelp() {
    if (view.kind !== "question") return;
    const referat = getOradsReferat(locale.locale);
    const sectionId = getReferatSectionIdForWizardNode(view.node.id, referat);
    navigation.navigate("ORADSGuide", { sectionId });
  }

  function shareToColleaguesTodo() {
    // TODO Phase 3: enqueue ChatService.sendSecondOpinion({ path, result, photos })
    console.warn("[O-RADS] shareToColleagues — Phase 3 ChatService");
  }

  const stepCurrent = Math.min(view.stepIndex, ESTIMATED_STEPS);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.back}>{rtl ? "›" : "‹"} {locale.t("orads.wizard.back")}</Text>
        </Pressable>
        <Text style={styles.title}>{locale.t("orads.wizard.title")}</Text>
        <Pressable onPress={() => dispatch({ type: "restart" })} hitSlop={8}>
          <Text style={styles.reset}>{locale.t("orads.wizard.restart")}</Text>
        </Pressable>
      </View>

      <OradsWizardProgress current={stepCurrent} total={ESTIMATED_STEPS} rtl={rtl} />
      <Text style={[styles.stepLabel, rtl && styles.textRtl]}>
        {locale.t("orads.wizard.step_of", { current: String(stepCurrent), total: String(ESTIMATED_STEPS) })}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View>
          <Text style={[styles.version, rtl && styles.textRtl]}>{locale.t("orads.meta.version")}</Text>

          {view.kind === "result" ? (
            <OradsWizardResultPanel
              result={view.result}
              locale={locale}
              pathSummary={pathSummary}
              onRestart={() => dispatch({ type: "restart" })}
              onBack={goBack}
              onShare={shareToColleaguesTodo}
              onOpenGuide={() => navigation.navigate("ORADSGuide", { sectionId: "categories" })}
              onAskAscites={() => dispatch({ type: "modifier_start" })}
            />
          ) : (
            <>
              <View style={[styles.questionRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.question, rtl && styles.textRtl, { flex: 1 }]}>
                  {locale.t(view.node.questionKey)}
                </Text>
                <Pressable onPress={openReferatHelp} hitSlop={10} style={styles.helpBtn}>
                  <Text style={styles.helpBtnText}>?</Text>
                </Pressable>
              </View>
              {view.node.helpKey ? (
                <Text style={[styles.help, rtl && styles.textRtl]}>{locale.t(view.node.helpKey)}</Text>
              ) : null}

              <OradsAtlasImage preview={atlasPreview} onOpenWeb={openAtlasWeb} />

              {view.node.options.map((opt) => (
                <OradsOptionCard
                  key={opt.id}
                  label={locale.t(opt.labelKey)}
                  rtl={rtl}
                  imageSlot={
                    opt.imageRef ? (
                      <OradsAtlasImage
                        preview={resolveOradsAtlasPreview(opt.imageRef)}
                        onOpenWeb={() => {
                          const referat = getOradsReferat(locale.locale);
                          navigation.navigate("ORADSGuide", {
                            caseId: opt.imageRef ? getReferatCaseIdForImageRef(opt.imageRef) : undefined,
                            sectionId: getReferatSectionIdForWizardNode(view.node.id, referat),
                          });
                        }}
                      />
                    ) : undefined
                  }
                  onPress={() => dispatch({ type: "pick", nodeId: view.node.id, optionId: opt.id })}
                />
              ))}

              <Pressable style={styles.proLink} onPress={() => navigation.navigate("ORADSPro")}>
                <Text style={styles.proLinkText}>{locale.t("orads.wizard.pro_link")}</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { minWidth: 88 },
  back: { color: "#2563EB", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  reset: { color: "#ea580c", fontWeight: "700", fontSize: 13, minWidth: 88, textAlign: "right" },
  stepLabel: {
    paddingHorizontal: 16,
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  scroll: { padding: 16, paddingBottom: 40 },
  version: { color: "#64748b", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  question: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  questionRow: { alignItems: "flex-start", gap: 8, marginBottom: 8 },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnText: { color: "#1D4ED8", fontWeight: "900", fontSize: 18 },
  help: { color: "#475569", fontSize: 14, lineHeight: 20, marginBottom: 12 },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  proLink: { marginTop: 16, alignSelf: "center" },
  proLinkText: { color: "#2563EB", fontWeight: "700", fontSize: 13 },
});
