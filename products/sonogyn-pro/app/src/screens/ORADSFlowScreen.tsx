import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  calculateOradsFlowResult,
  type ColorScore,
  type CystLocularity,
  type FlowType,
  type InnerContour,
  type LesionKind,
  type LocationType,
  type Menopause,
  type OuterContour,
} from "../guidelines/orads-flow-rules";
import type { RootStackParamList } from "../navigation/AppStack";
import ReportBlock from "../components/ReportBlock";
import { parseOradsNumberFromCategory } from "../reporting/generateReport";
import type { ReportInput } from "../reporting/ovaryReportInput";
import { theme } from "../theme";
import i18n from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSFlow">;

export type AgeCategory = "lt25" | "25_39" | "40_54" | "ge55";
export type MenopausalStatus = "reproductive" | "peri" | "post";
export type CycleRegularity = "regular" | "irregular";

function FlowCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.flowCard, selected && styles.flowCardActive]}>
      <Text style={[styles.flowTitle, selected && styles.flowTitleActive]}>{title}</Text>
      {subtitle ? <Text style={styles.flowSubtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export default function ORADSFlowScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [ageCategory, setAgeCategory] = useState<AgeCategory | undefined>(undefined);
  const [menopausalStatus, setMenopausalStatus] = useState<MenopausalStatus | undefined>(undefined);
  const [cycleRegularity, setCycleRegularity] = useState<CycleRegularity | undefined>(undefined);
  const [location, setLocation] = useState<LocationType | undefined>(undefined);
  const [menopause, setMenopause] = useState<Menopause>("premenopausal");
  const [flowType, setFlowType] = useState<FlowType | undefined>(undefined);
  const [follicle, setFollicle] = useState(false);
  const [corpusLuteum, setCorpusLuteum] = useState(false);
  const [lesionKind, setLesionKind] = useState<LesionKind | undefined>(undefined);
  const [locularity, setLocularity] = useState<CystLocularity>("unilocular");
  const [innerContour, setInnerContour] = useState<InnerContour>("smooth");
  const [outerContour, setOuterContour] = useState<OuterContour>("smooth");
  const [papillaryCount, setPapillaryCount] = useState("0");
  const [solidComponent, setSolidComponent] = useState(false);
  const [colorScore, setColorScore] = useState<ColorScore>(1);
  const [ascitesOrImplants, setAscitesOrImplants] = useState(false);
  const [sizeCmInput, setSizeCmInput] = useState("5");
  const [reportDesc, setReportDesc] = useState("");
  const [romaPct, setRomaPct] = useState("");
  const [romaRisk, setRomaRisk] = useState<"low" | "high">("low");
  const prevStepRef = useRef(step);

  const sizeCm = Number(sizeCmInput) || 0;
  const papillary = Number(papillaryCount) || 0;

  useEffect(() => {
    if (!menopausalStatus) return;
    if (menopausalStatus === "post") {
      setMenopause("postmenopausal");
      setFlowType((prev) => (prev === "physiologic" ? undefined : prev));
    } else {
      setMenopause("premenopausal");
    }
  }, [menopausalStatus]);

  const result = useMemo(
    () =>
      calculateOradsFlowResult({
        location,
        menopause,
        flowType,
        follicle,
        corpusLuteum,
        lesionKind,
        locularity,
        innerContour,
        outerContour,
        papillaryCount: papillary,
        solidComponent,
        colorScore,
        ascitesOrImplants,
        sizeCm,
      }),
    [
      location,
      menopause,
      flowType,
      follicle,
      corpusLuteum,
      lesionKind,
      locularity,
      innerContour,
      outerContour,
      papillary,
      solidComponent,
      colorScore,
      ascitesOrImplants,
      sizeCm,
    ]
  );

  useEffect(() => {
    const was = prevStepRef.current;
    prevStepRef.current = step;
    if (step === 6 && was !== 6) {
      setReportDesc(result.summary);
    }
  }, [step, result.summary]);

  const showIrregularCycleHint = cycleRegularity === "irregular";
  const canShowPhysiologic = menopausalStatus === "reproductive" || menopausalStatus === "peri";

  const reportInput = useMemo((): ReportInput => {
    const trimmed = romaPct.trim().replace(",", ".");
    const n = trimmed === "" ? NaN : Number(trimmed);
    const romaOk = Number.isFinite(n) && n >= 0;
    return {
      organ: "ovary",
      description: reportDesc,
      orads: parseOradsNumberFromCategory(result.category),
      ...(romaOk ? { roma: n } : {}),
      romaRisk,
      menopausalStatus: menopausalStatus ?? "reproductive",
    };
  }, [reportDesc, result.category, romaPct, romaRisk, menopausalStatus]);

  const breadcrumb = useMemo(() => {
    const parts = [i18n.t("orads_breadcrumb_home")];
    if (ageCategory) parts.push(i18n.t(`orads_age_${ageCategory}`));
    if (menopausalStatus) parts.push(i18n.t(`orads_patient_${menopausalStatus}`));
    if (cycleRegularity) parts.push(i18n.t(`orads_cycle_${cycleRegularity}`));
    if (location === "ovarian") parts.push(i18n.t("orads_location_ovarian"));
    if (location === "extraovarian") parts.push(i18n.t("orads_location_extraovarian"));
    if (flowType === "physiologic") parts.push(i18n.t("orads_type_physiologic"));
    if (flowType === "lesion") parts.push(i18n.t("orads_type_lesion"));
    if (follicle) parts.push(i18n.t("orads_subtype_follicle"));
    if (corpusLuteum) parts.push(i18n.t("orads_subtype_corpus_luteum"));
    if (lesionKind) parts.push(i18n.t(`orads_lesion_${lesionKind}`));
    return parts.join(" > ");
  }, [ageCategory, menopausalStatus, cycleRegularity, location, flowType, follicle, corpusLuteum, lesionKind, i18n.locale]);

  function resetBelowStep(nextStep: number) {
    if (nextStep <= 2) {
      setFlowType(undefined);
      setFollicle(false);
      setCorpusLuteum(false);
      setLesionKind(undefined);
    }
    if (nextStep <= 3) {
      setFollicle(false);
      setCorpusLuteum(false);
      setLesionKind(undefined);
    }
    if (nextStep <= 4) {
      setLesionKind(undefined);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{i18n.t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{i18n.t("orads_title")}</Text>
        <Pressable style={styles.backBtn} onPress={() => navigation.navigate("Language")}>
          <Text style={styles.backBtnText}>{i18n.t("language")}</Text>
        </Pressable>
      </View>

      <Text style={styles.breadcrumb}>{breadcrumb}</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step0_title")}</Text>
            <Text style={styles.label}>{i18n.t("orads_age_category")}</Text>
            <View style={styles.row}>
              <FlowCard
                title={i18n.t("orads_age_lt25")}
                selected={ageCategory === "lt25"}
                onPress={() => setAgeCategory("lt25")}
              />
              <FlowCard
                title={i18n.t("orads_age_25_39")}
                selected={ageCategory === "25_39"}
                onPress={() => setAgeCategory("25_39")}
              />
            </View>
            <View style={styles.row}>
              <FlowCard
                title={i18n.t("orads_age_40_54")}
                selected={ageCategory === "40_54"}
                onPress={() => setAgeCategory("40_54")}
              />
              <FlowCard
                title={i18n.t("orads_age_ge55")}
                selected={ageCategory === "ge55"}
                onPress={() => setAgeCategory("ge55")}
              />
            </View>
            <Text style={styles.label}>{i18n.t("orads_menstrual_status")}</Text>
            <View style={styles.row}>
              <FlowCard
                title={i18n.t("orads_patient_reproductive")}
                selected={menopausalStatus === "reproductive"}
                onPress={() => setMenopausalStatus("reproductive")}
              />
              <FlowCard
                title={i18n.t("orads_patient_peri")}
                selected={menopausalStatus === "peri"}
                onPress={() => setMenopausalStatus("peri")}
              />
              <FlowCard
                title={i18n.t("orads_patient_post")}
                selected={menopausalStatus === "post"}
                onPress={() => setMenopausalStatus("post")}
              />
            </View>
            <Text style={styles.label}>{i18n.t("orads_cycle_label")}</Text>
            <View style={styles.row}>
              <FlowCard
                title={i18n.t("orads_cycle_regular")}
                selected={cycleRegularity === "regular"}
                onPress={() => setCycleRegularity("regular")}
              />
              <FlowCard
                title={i18n.t("orads_cycle_irregular")}
                selected={cycleRegularity === "irregular"}
                onPress={() => setCycleRegularity("irregular")}
              />
            </View>
            {showIrregularCycleHint ? <Text style={styles.clinicalHint}>{i18n.t("orads_hint_irregular_cycle")}</Text> : null}
            <Pressable
              style={[
                styles.primaryBtn,
                (!ageCategory || !menopausalStatus || !cycleRegularity) && styles.disabled,
              ]}
              disabled={!ageCategory || !menopausalStatus || !cycleRegularity}
              onPress={() => setStep(1)}
            >
              <Text style={styles.primaryBtnText}>{i18n.t("next")}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step1_title")}</Text>
            <FlowCard
              title={i18n.t("orads_location_ovarian_adnexal")}
              selected={location === "ovarian"}
              onPress={() => {
                setLocation("ovarian");
                resetBelowStep(2);
                setStep(2);
              }}
            />
            <FlowCard
              title={i18n.t("orads_location_extraovarian")}
              selected={location === "extraovarian"}
              onPress={() => {
                setLocation("extraovarian");
                resetBelowStep(5);
                setStep(6);
              }}
            />
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(0)}>
              <Text style={styles.secondaryBtnText}>{i18n.t("orads_edit_patient")}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 && location === "ovarian" ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step2_title")}</Text>
            <Text style={styles.label}>{i18n.t("orads_patient_context_summary")}</Text>
            <Text style={styles.contextLine}>
              {ageCategory ? i18n.t(`orads_age_${ageCategory}`) : i18n.t("orads_value_placeholder")} ·{" "}
              {menopausalStatus ? i18n.t(`orads_patient_${menopausalStatus}`) : i18n.t("orads_value_placeholder")} ·{" "}
              {cycleRegularity ? i18n.t(`orads_cycle_${cycleRegularity}`) : i18n.t("orads_value_placeholder")}
            </Text>
            {showIrregularCycleHint ? <Text style={styles.clinicalHint}>{i18n.t("orads_hint_irregular_cycle")}</Text> : null}

            {canShowPhysiologic ? (
              <FlowCard
                title={i18n.t("orads_type_physiologic")}
                subtitle={i18n.t("orads_physiologic_reproductive_peri_only")}
                selected={flowType === "physiologic"}
                onPress={() => {
                  setFlowType("physiologic");
                  setStep(3);
                }}
              />
            ) : null}
            <FlowCard
              title={i18n.t("orads_type_lesion")}
              selected={flowType === "lesion"}
              onPress={() => {
                setFlowType("lesion");
                setStep(3);
              }}
            />
          </View>
        ) : null}

        {step === 3 && flowType === "physiologic" ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step3_title")}</Text>
            {showIrregularCycleHint ? <Text style={styles.clinicalHint}>{i18n.t("orads_hint_irregular_cycle")}</Text> : null}
            <FlowCard
              title={i18n.t("orads_subtype_follicle")}
              selected={follicle}
              onPress={() => {
                setFollicle(true);
                setCorpusLuteum(false);
                setStep(6);
              }}
            />
            <FlowCard
              title={i18n.t("orads_subtype_corpus_luteum")}
              selected={corpusLuteum}
              onPress={() => {
                setCorpusLuteum(true);
                setFollicle(false);
                setStep(6);
              }}
            />
          </View>
        ) : null}

        {step === 3 && flowType === "lesion" ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step3_title")}</Text>
            <FlowCard
              title={i18n.t("orads_type_lesion")}
              selected
              onPress={() => setStep(4)}
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step4_title")}</Text>
            {showIrregularCycleHint && location === "ovarian" ? (
              <Text style={styles.clinicalHint}>{i18n.t("orads_hint_irregular_cycle")}</Text>
            ) : null}
            <FlowCard title={i18n.t("orads_lesion_simple_cyst")} selected={lesionKind === "simple_cyst"} onPress={() => setLesionKind("simple_cyst")} />
            <FlowCard title={i18n.t("orads_lesion_hemorrhagic_cyst")} selected={lesionKind === "hemorrhagic_cyst"} onPress={() => setLesionKind("hemorrhagic_cyst")} />
            <FlowCard title={i18n.t("orads_lesion_dermoid")} selected={lesionKind === "dermoid"} onPress={() => setLesionKind("dermoid")} />
            <FlowCard title={i18n.t("orads_lesion_endometrioma")} selected={lesionKind === "endometrioma"} onPress={() => setLesionKind("endometrioma")} />
            <FlowCard title={i18n.t("orads_lesion_paraovarian")} selected={lesionKind === "paraovarian"} onPress={() => setLesionKind("paraovarian")} />
            <FlowCard title={i18n.t("orads_lesion_peritoneal")} selected={lesionKind === "peritoneal"} onPress={() => setLesionKind("peritoneal")} />
            <FlowCard title={i18n.t("orads_lesion_hydrosalpinx")} selected={lesionKind === "hydrosalpinx"} onPress={() => setLesionKind("hydrosalpinx")} />
            <FlowCard title={i18n.t("orads_lesion_other")} selected={lesionKind === "other"} onPress={() => setLesionKind("other")} />
            <Pressable
              style={[styles.primaryBtn, !lesionKind && styles.disabled]}
              onPress={() => lesionKind && setStep(5)}
              disabled={!lesionKind}
            >
              <Text style={styles.primaryBtnText}>{i18n.t("next")}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{i18n.t("orads_step5_title")}</Text>
            {showIrregularCycleHint && location === "ovarian" ? (
              <Text style={styles.clinicalHint}>{i18n.t("orads_hint_irregular_cycle")}</Text>
            ) : null}
            <Text style={styles.label}>{i18n.t("orads_locularity_morphology")}</Text>
            <View style={styles.row}>
              <FlowCard title={i18n.t("orads_locularity_unilocular")} selected={locularity === "unilocular"} onPress={() => setLocularity("unilocular")} />
              <FlowCard title={i18n.t("orads_locularity_multilocular")} selected={locularity === "multilocular"} onPress={() => setLocularity("multilocular")} />
              <FlowCard title={i18n.t("orads_locularity_solid")} selected={locularity === "solid"} onPress={() => setLocularity("solid")} />
            </View>

            <Text style={styles.label}>{i18n.t("orads_inner_contour")}</Text>
            <View style={styles.row}>
              <FlowCard title={i18n.t("orads_contour_smooth")} selected={innerContour === "smooth"} onPress={() => setInnerContour("smooth")} />
              <FlowCard title={i18n.t("orads_contour_irregular")} selected={innerContour === "irregular"} onPress={() => setInnerContour("irregular")} />
            </View>

            <Text style={styles.label}>{i18n.t("orads_outer_contour")}</Text>
            <View style={styles.row}>
              <FlowCard title={i18n.t("orads_contour_smooth")} selected={outerContour === "smooth"} onPress={() => setOuterContour("smooth")} />
              <FlowCard title={i18n.t("orads_contour_irregular")} selected={outerContour === "irregular"} onPress={() => setOuterContour("irregular")} />
            </View>

            <Text style={styles.label}>{i18n.t("orads_papillary_count")}</Text>
            <TextInput
              value={papillaryCount}
              onChangeText={setPapillaryCount}
              keyboardType="numeric"
              style={styles.input}
              placeholder={i18n.t("orads_papillary_placeholder")}
            />

            <Text style={styles.label}>{i18n.t("sign_solid_component")}</Text>
            <View style={styles.row}>
              <FlowCard title={i18n.t("option_no")} selected={!solidComponent} onPress={() => setSolidComponent(false)} />
              <FlowCard title={i18n.t("option_yes")} selected={solidComponent} onPress={() => setSolidComponent(true)} />
            </View>

            <Text style={styles.label}>{i18n.t("orads_color_score")}</Text>
            <View style={styles.row}>
              <FlowCard title="1" selected={colorScore === 1} onPress={() => setColorScore(1)} />
              <FlowCard title="2" selected={colorScore === 2} onPress={() => setColorScore(2)} />
              <FlowCard title="3" selected={colorScore === 3} onPress={() => setColorScore(3)} />
              <FlowCard title="4" selected={colorScore === 4} onPress={() => setColorScore(4)} />
            </View>

            <Text style={styles.label}>{i18n.t("orads_size_cm")}</Text>
            <TextInput
              value={sizeCmInput}
              onChangeText={setSizeCmInput}
              keyboardType="numeric"
              style={styles.input}
              placeholder={i18n.t("orads_size_placeholder")}
            />

            <Text style={styles.label}>{i18n.t("orads_ascites_implants")}</Text>
            <View style={styles.row}>
              <FlowCard title={i18n.t("option_no")} selected={!ascitesOrImplants} onPress={() => setAscitesOrImplants(false)} />
              <FlowCard title={i18n.t("option_yes")} selected={ascitesOrImplants} onPress={() => setAscitesOrImplants(true)} />
            </View>

            <Pressable style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.primaryBtnText}>{i18n.t("orads_show_result")}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultCategory}>{result.category}</Text>
            <Text style={styles.resultRisk}>{result.risk}</Text>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            <Text style={styles.managementTitle}>{i18n.t("orads_management")}</Text>
            {result.management.map((item) => (
              <Text key={item} style={styles.managementItem}>
                - {item}
              </Text>
            ))}

            <Text style={styles.label}>{i18n.t("report_desc_label")}</Text>
            <TextInput
              value={reportDesc}
              onChangeText={setReportDesc}
              multiline
              textAlignVertical="top"
              style={styles.reportDescInput}
              placeholder={i18n.t("report_placeholder_description")}
            />

            <Text style={styles.label}>{i18n.t("report_roma_pct_label")}</Text>
            <TextInput
              value={romaPct}
              onChangeText={setRomaPct}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
            />
            <View style={styles.row}>
              <FlowCard
                title={i18n.t("report_roma_risk_low_label")}
                selected={romaRisk === "low"}
                onPress={() => setRomaRisk("low")}
              />
              <FlowCard
                title={i18n.t("report_roma_risk_high_label")}
                selected={romaRisk === "high"}
                onPress={() => setRomaRisk("high")}
              />
            </View>

            <ReportBlock
              input={reportInput}
              onSaveToCase={(draft) =>
                navigation.navigate("Case", {
                  caseId: undefined,
                  draftDescription: draft,
                  draftOrgan: "ovary",
                  draftResultCategory: result.category,
                  draftTimestamp: Date.now(),
                })
              }
            />

            <View style={styles.actions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setStep(Math.max(0, step - 1))}>
                <Text style={styles.secondaryBtnText}>{i18n.t("back")}</Text>
              </Pressable>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  setStep(0);
                  setAgeCategory(undefined);
                  setMenopausalStatus(undefined);
                  setCycleRegularity(undefined);
                  setLocation(undefined);
                  setFlowType(undefined);
                  setFollicle(false);
                  setCorpusLuteum(false);
                  setLesionKind(undefined);
                  setLocularity("unilocular");
                  setInnerContour("smooth");
                  setOuterContour("smooth");
                  setPapillaryCount("0");
                  setSolidComponent(false);
                  setColorScore(1);
                  setAscitesOrImplants(false);
                  setSizeCmInput("5");
                  setMenopause("premenopausal");
                }}
              >
                <Text style={styles.primaryBtnText}>{i18n.t("orads_start_over")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnText: { color: theme.colors.text, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  breadcrumb: {
    paddingHorizontal: 16,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  stepTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.text },
  flowCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    gap: 4,
    flex: 1,
  },
  flowCardActive: { borderColor: theme.colors.primary, backgroundColor: "#E8F2FC" },
  flowTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  flowTitleActive: { color: theme.colors.primary },
  flowSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
  label: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  contextLine: { color: theme.colors.text, fontSize: 13, fontWeight: "600" },
  clinicalHint: {
    fontSize: 12,
    color: "#92400e",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 10,
  },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  resultCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  resultCategory: { fontSize: 28, fontWeight: "800", color: theme.colors.text },
  resultRisk: { fontSize: 16, color: theme.colors.primary, fontWeight: "700" },
  resultSummary: { color: theme.colors.textSecondary, fontSize: 14 },
  managementTitle: { marginTop: 4, fontSize: 16, fontWeight: "700", color: theme.colors.text },
  managementItem: { fontSize: 14, color: theme.colors.textSecondary },
  reportDescInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 88,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
});
