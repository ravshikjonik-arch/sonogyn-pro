import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ageFromBirthDateIso } from "@repo/types";
import { useMemo, useState } from "react";
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
  getOradsReferat,
  getReferatCaseIdForImageRef,
  getReferatSectionIdForWizardNode,
  useOradsNavigator,
} from "@repo/orads-us";

import type { RootStackParamList } from "../../navigation/paramLists";
import { getWebApiBase } from "../../api/chatBackend";
import OradsAssistPanel from "./OradsAssistPanel";
import OradsAtlasImage from "./OradsAtlasImage";
import OradsOptionCard from "./OradsOptionCard";
import OradsWizardProgress from "./OradsWizardProgress";
import OradsWizardResultPanel from "./OradsWizardResultPanel";
import { resolveOradsAtlasPreview } from "./resolveOradsAtlas";
import { useOradsLocaleStrings } from "./useOradsLocale";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSWizard">;

export default function OradsWizardScreen({ navigation, route }: Props) {
  const locale = useOradsLocaleStrings();
  const [mode, setMode] = useState<"stepper" | "assist">("stepper");
  const profileAgeYears = useMemo(() => {
    const iso = route.params?.patientBirthDateIso;
    return iso ? ageFromBirthDateIso(iso) ?? undefined : undefined;
  }, [route.params?.patientBirthDateIso]);

  const nav = useOradsNavigator({
    estimatedSteps: 6,
    translate: (key) => locale.t(key),
  });

  const view = nav.view;

  const atlasPreview = useMemo(() => {
    if (view.kind !== "question") return null;
    return resolveOradsAtlasPreview(view.node.imageRef);
  }, [view]);

  const rtl = locale.rtl || I18nManager.isRTL;
  const rowDirection = rtl ? "row-reverse" : "row";

  function goBack() {
    if (mode === "assist") {
      setMode("stepper");
      return;
    }
    if (!nav.canPopStep && nav.state.path.length === 0) {
      navigation.goBack();
      return;
    }
    nav.back();
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
    console.warn("[O-RADS] shareToColleagues — Phase 3 ChatService");
  }

  function openStructuredReport() {
    if (view.kind !== "result") return;
    navigation.navigate("StructuredReportPreview", {
      path: nav.state.path,
      result: view.result,
      pathSummary: nav.pathSummary,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.back}>
            {rtl ? "›" : "‹"} {locale.t("orads.wizard.back")}
          </Text>
        </Pressable>
        <Text style={styles.title}>{locale.t("orads.wizard.title")}</Text>
        <Pressable onPress={nav.restart} hitSlop={8}>
          <Text style={styles.reset}>{locale.t("orads.wizard.restart")}</Text>
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeBtn, mode === "stepper" && styles.modeBtnActive]}
          onPress={() => setMode("stepper")}
        >
          <Text style={[styles.modeBtnText, mode === "stepper" && styles.modeBtnTextActive]}>Пошагово</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === "assist" && styles.modeBtnActive]}
          onPress={() => setMode("assist")}
        >
          <Text style={[styles.modeBtnText, mode === "assist" && styles.modeBtnTextActive]}>Из описания</Text>
        </Pressable>
      </View>

      {mode === "assist" ? (
        <View style={styles.assistWrap}>
          <OradsAssistPanel
            nav={nav}
            profileAgeYears={profileAgeYears}
            patientId={route.params?.patientId}
            onApplyStepper={() => setMode("stepper")}
          />
        </View>
      ) : (
        <>
          <OradsWizardProgress current={nav.stepCurrent} total={nav.estimatedSteps} rtl={rtl} />
          <Text style={[styles.stepLabel, rtl && styles.textRtl]}>
            {locale.t("orads.wizard.step_of", {
              current: String(nav.stepCurrent),
              total: String(nav.estimatedSteps),
            })}
          </Text>

          <ScrollView contentContainerStyle={styles.scroll}>
            <Animated.View>
              <Text style={[styles.version, rtl && styles.textRtl]}>{locale.t("orads.meta.version")}</Text>

              {view.kind === "result" ? (
                <OradsWizardResultPanel
                  result={view.result}
                  locale={locale}
                  pathSummary={nav.pathSummary}
                  onRestart={nav.restart}
                  onBack={goBack}
                  onShare={shareToColleaguesTodo}
                  onBuildReport={openStructuredReport}
                  onOpenGuide={() => navigation.navigate("ORADSGuide", { sectionId: "categories" })}
                  onAskAscites={nav.startAscitesModifier}
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
                      onPress={() => nav.pick(view.node.id, opt.id)}
                    />
                  ))}

                  <Pressable style={styles.proLink} onPress={() => navigation.navigate("ORADSPro")}>
                    <Text style={styles.proLinkText}>{locale.t("orads.wizard.pro_link")}</Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </>
      )}
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
  modeRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#2563EB" },
  modeBtnText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  modeBtnTextActive: { color: "#fff" },
  assistWrap: { flex: 1, paddingHorizontal: 16 },
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
