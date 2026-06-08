import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import type { RootStackParamList } from "../navigation/AppStack";
import { useCases } from "../hooks/useCases";
import { useComments } from "../hooks/useComments";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useProAccess } from "../hooks/useProAccess";
import { getCaseById } from "../services/firebase/casesService";
import type { OrganType, OradsSnapshot } from "../features/case/types";
import ProBadge from "../components/ProBadge";
import DescriptionBlock from "../components/DescriptionBlock";
import { containsBadWords, reportContent, type ReportReason } from "../services/firebase/reportService";
import {
  explainDescription,
  generateDescription,
  getDescriptionKeywords,
  OVARIAN_DESCRIPTION_EXAMPLE,
  type OvarianDescriptionFeatures,
} from "../features/case/ovaryDescription";
import i18n from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Case">;

type AssistantQuestion = {
  id: string;
  titleKey: string;
  options: string[];
};

function signsByOrgan(organ: OrganType): AssistantQuestion[] {
  if (organ === "breast") {
    return [
      { id: "shape", titleKey: "sign_shape", options: ["option_oval", "option_irregular"] },
      { id: "margin", titleKey: "sign_margin", options: ["option_smooth", "option_spiculated"] },
      { id: "flow", titleKey: "sign_flow", options: ["option_none_minimal", "option_marked"] },
    ];
  }
  if (organ === "ovary") {
    return [
      { id: "structure", titleKey: "sign_structure", options: ["option_cystic", "option_solid", "option_mixed"] },
      { id: "locules", titleKey: "sign_locules", options: ["option_unilocular", "option_multilocular"] },
      { id: "echogenicity", titleKey: "sign_echogenicity", options: ["option_anechoic", "option_low_level", "option_hyperechoic"] },
      { id: "wall", titleKey: "sign_wall", options: ["option_smooth", "option_irregular"] },
      { id: "septa", titleKey: "sign_septa", options: ["option_none", "option_thin", "option_thick"] },
      { id: "vascularity", titleKey: "sign_vascularity", options: ["option_none", "option_peripheral", "option_internal"] },
      { id: "solid", titleKey: "sign_solid_component", options: ["option_no", "option_yes"] },
      { id: "pap", titleKey: "sign_papillary", options: ["option_no", "option_yes"] },
      { id: "ascites", titleKey: "sign_ascites", options: ["option_no", "option_yes"] },
    ];
  }
  if (organ === "uterus") {
    return [
      { id: "endo", titleKey: "sign_endometrium_contact", options: ["option_no", "option_yes"] },
      { id: "serosa", titleKey: "sign_serosa_contact", options: ["option_no", "option_yes"] },
      { id: "ped", titleKey: "sign_pedicle", options: ["option_no", "option_yes"] },
    ];
  }
  return [
    { id: "hilum", titleKey: "sign_fatty_hilum", options: ["option_preserved", "option_not_seen"] },
    { id: "cortex", titleKey: "sign_cortex", options: ["option_thin", "option_thickened"] },
    { id: "vascular", titleKey: "sign_vascularization", options: ["option_hilar", "option_peripheral"] },
  ];
}

function evaluateFromAnswers(
  organ: OrganType,
  answers: Record<string, string>
): { category: string; level: "low" | "medium" | "high"; text: string } {
  const riskPoints = Object.values(answers).filter((v) =>
    ["option_irregular", "option_spiculated", "option_marked", "option_yes", "option_not_seen", "option_thickened", "option_peripheral"].includes(v)
  ).length;
  if (organ === "breast") {
    if (riskPoints >= 2) return { category: "BI-RADS 4", level: "high", text: i18n.t("result_birads4") };
    return { category: "BI-RADS 3", level: "medium", text: i18n.t("result_birads3") };
  }
  if (organ === "ovary") {
    if (riskPoints >= 2) return { category: "O-RADS 4", level: "high", text: i18n.t("result_orads4") };
    return { category: "O-RADS 2", level: "low", text: i18n.t("result_orads2") };
  }
  if (organ === "uterus") {
    return riskPoints >= 2
      ? { category: "FIGO 3", level: "medium", text: i18n.t("result_figo3") }
      : { category: "FIGO 5", level: "low", text: i18n.t("result_figo5") };
  }
  return riskPoints >= 2
    ? { category: "LN-RADS 4", level: "high", text: i18n.t("result_lnrads4") }
    : { category: "LN-RADS 2", level: "low", text: i18n.t("result_lnrads2") };
}

function getAiStubText(organ: OrganType, answers: Record<string, string>) {
  if (organ === "ovary") {
    if (answers.solid === "option_yes" || answers.pap === "option_yes") return i18n.t("ai_ovary_suspicious");
    return i18n.t("ai_ovary_benign");
  }
  if (organ === "breast") {
    if (answers.margin === "option_spiculated" || answers.flow === "option_marked") return i18n.t("ai_breast_suspicious");
    return i18n.t("ai_breast_probably_benign");
  }
  if (organ === "uterus") return i18n.t("ai_uterus_typical_myoma");
  return i18n.t("ai_reactive_node");
}

type AiStubResult = {
  text: string;
  confidence: number;
  reason: string;
};

function confidenceLevel(value: number): "low" | "medium" | "high" {
  if (value >= 80) return "high";
  if (value >= 65) return "medium";
  return "low";
}

function getAiStubAnalysis(organ: OrganType, answers: Record<string, string>): AiStubResult {
  if (organ === "ovary") {
    if (answers.solid === "option_yes" || answers.pap === "option_yes") {
      return {
        text: i18n.t("ai_ovary_suspicious"),
        confidence: 82,
        reason: i18n.t("ai_reason_ovary_suspicious"),
      };
    }
    return {
      text: i18n.t("ai_ovary_benign"),
      confidence: 74,
      reason: i18n.t("ai_reason_ovary_benign"),
    };
  }
  if (organ === "breast") {
    if (answers.margin === "option_spiculated" || answers.flow === "option_marked") {
      return {
        text: i18n.t("ai_breast_suspicious"),
        confidence: 80,
        reason: i18n.t("ai_reason_breast_suspicious"),
      };
    }
    return {
      text: i18n.t("ai_breast_probably_benign"),
      confidence: 72,
      reason: i18n.t("ai_reason_breast_benign"),
    };
  }
  if (organ === "uterus") {
    return {
      text: i18n.t("ai_uterus_typical_myoma"),
      confidence: 76,
      reason: i18n.t("ai_reason_uterus"),
    };
  }
  return {
    text: getAiStubText(organ, answers),
    confidence: 70,
    reason: i18n.t("ai_reason_lymph"),
  };
}

export default function CaseScreen({ navigation, route }: Props) {
  const initialCaseId = route.params?.caseId;
  const [caseId, setCaseId] = useState<string | undefined>(initialCaseId);
  const [organ, setOrgan] = useState<OrganType>("breast");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [autoFillOvaryDescription, setAutoFillOvaryDescription] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiReason, setAiReason] = useState("");
  const [loadingCase, setLoadingCase] = useState(false);
  const [loadCaseError, setLoadCaseError] = useState<string | null>(null);
  const [caseReloadKey, setCaseReloadKey] = useState(0);
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const prevCommentsLenRef = useRef(0);
  const [resultOverride, setResultOverride] = useState<string | null>(null);
  const draftOrganAtOpenRef = useRef<OrganType | null>(null);
  const lastDraftTimestampRef = useRef<number | undefined>(undefined);
  const draftOradsSnapshotRef = useRef<OradsSnapshot | undefined>(undefined);

  const { createNewCase, saving } = useCases();
  const {
    comments,
    createComment,
    loading: commentsLoading,
    saving: commentSaving,
    error: commentsError,
    reload: reloadComments,
  } = useComments(caseId);
  const { user, stars } = useCurrentUser();
  const { isPro } = useProAccess();

  const questions = useMemo(() => signsByOrgan(organ), [organ]);
  const resultBase = useMemo(() => evaluateFromAnswers(organ, answers), [organ, answers]);
  const result = useMemo(() => {
    if (resultOverride) {
      return { category: resultOverride, level: "medium" as const, text: resultOverride };
    }
    return resultBase;
  }, [resultBase, resultOverride]);
  const ovarianFeatures = useMemo<OvarianDescriptionFeatures>(
    () => ({
      structure:
        answers.structure === "option_solid" ? "solid" : answers.structure === "option_mixed" ? "mixed" : "cystic",
      locules: answers.locules === "option_multilocular" ? "multilocular" : "unilocular",
      echogenicity:
        answers.echogenicity === "option_low_level"
          ? "low-level"
          : answers.echogenicity === "option_hyperechoic"
            ? "hyperechoic"
            : "anechoic",
      wall: answers.wall === "option_irregular" ? "irregular" : "smooth",
      septa:
        answers.septa === "option_thin" ? "thin" : answers.septa === "option_thick" ? "thick" : "none",
      solidComponent: answers.solid === "option_yes",
      vascularity:
        answers.vascularity === "option_peripheral"
          ? "peripheral"
          : answers.vascularity === "option_internal"
            ? "internal"
            : "none",
    }),
    [answers]
  );
  const autoDescription = useMemo(() => generateDescription(ovarianFeatures), [ovarianFeatures]);
  const autoDescriptionWhy = useMemo(() => explainDescription(ovarianFeatures), [ovarianFeatures]);
  const autoDescriptionKeywords = useMemo(() => getDescriptionKeywords(ovarianFeatures), [ovarianFeatures]);
  const isCreateMode = !caseId;
  const showOfflineBanner =
    (!loadingCase && !!loadCaseError && !description) ||
    (!commentsLoading && !!commentsError && comments.length === 0);
  const aiConfidenceTone = aiConfidence === null ? null : confidenceLevel(aiConfidence);

  useEffect(() => {
    if (initialCaseId) return;
    if (route.params?.startAtImage) setStep(2);
  }, [initialCaseId, route.params?.startAtImage]);

  useEffect(() => {
    async function loadCase() {
      if (!initialCaseId) return;
      try {
        setLoadingCase(true);
        setLoadCaseError(null);
        const row = await getCaseById(initialCaseId);
        if (!row) return;
        setCaseId(row.id);
        setOrgan(row.organ);
        setDescription(row.description);
        setImageUri(row.imageUrl);
      } catch (error) {
        setLoadCaseError(error instanceof Error ? error.message : i18n.t("load_error"));
      } finally {
        setLoadingCase(false);
      }
    }
    void loadCase();
  }, [initialCaseId, caseReloadKey]);

  useEffect(() => {
    if (!isCreateMode) return;
    if (organ !== "ovary") return;
    if (!autoFillOvaryDescription) return;
    setDescription(autoDescription);
  }, [isCreateMode, organ, autoFillOvaryDescription, autoDescription]);

  useEffect(() => {
    if (initialCaseId) return;
    const ts = route.params?.draftTimestamp;
    if (typeof ts !== "number") return;
    if (lastDraftTimestampRef.current === ts) return;
    lastDraftTimestampRef.current = ts;
    const p = route.params ?? {};
    draftOrganAtOpenRef.current = p.draftOrgan ?? null;
    draftOradsSnapshotRef.current = p.draftOradsInput
      ? {
          input: p.draftOradsInput as unknown as Record<string, unknown>,
          resultCategory:
            typeof p.draftResultCategory === "string" && p.draftResultCategory.trim()
              ? p.draftResultCategory
              : undefined,
        }
      : undefined;
    if (typeof p.draftDescription === "string" && p.draftDescription.trim()) setDescription(p.draftDescription);
    if (p.draftOrgan) setOrgan(p.draftOrgan);
    setResultOverride(
      typeof p.draftResultCategory === "string" && p.draftResultCategory.trim() ? p.draftResultCategory : null
    );
  }, [
    initialCaseId,
    route.params?.draftTimestamp,
    route.params?.draftDescription,
    route.params?.draftOrgan,
    route.params?.draftResultCategory,
    route.params?.draftOradsInput,
  ]);

  useEffect(() => {
    if (!resultOverride) return;
    if (Object.keys(answers).length > 0) setResultOverride(null);
  }, [answers, resultOverride]);

  useEffect(() => {
    if (!resultOverride) return;
    if (draftOrganAtOpenRef.current && organ !== draftOrganAtOpenRef.current) setResultOverride(null);
  }, [organ, resultOverride]);

  useEffect(() => {
    const prev = prevCommentsLenRef.current;
    if (prev > 0 && comments.length > prev) {
      const msg = i18n.t("new_comment");
      if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert(msg);
    }
    prevCommentsLenRef.current = comments.length;
  }, [comments.length]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(i18n.t("no_access"), i18n.t("allow_photo_access"));
      return;
    }
    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!selected.canceled && selected.assets[0]) {
      setImageUri(selected.assets[0].uri);
    }
  }

  async function pickImageFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(i18n.t("no_access"), i18n.t("allow_camera_access"));
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!shot.canceled && shot.assets[0]) {
      setImageUri(shot.assets[0].uri);
    }
  }

  async function onPublishCase() {
    if (!description.trim()) {
      Alert.alert(i18n.t("fill_description"), i18n.t("add_case_description"));
      return;
    }
    try {
      const created = await createNewCase({
        organ,
        description: size.trim()
          ? `${description.trim()} | ${i18n.t("size_optional")}: ${size.trim()}`
          : description.trim(),
        result: result.category,
        imageUri,
        oradsSnapshot: organ === "ovary" ? draftOradsSnapshotRef.current : undefined,
      });
      if (created?.id) setCaseId(created.id);
      Alert.alert(i18n.t("success"), i18n.t("case_published"));
    } catch (error) {
      const details = error instanceof Error ? error.message : i18n.t("save_case_failed");
      Alert.alert(i18n.t("error"), details);
    }
  }

  async function onSendComment() {
    if (!commentInput.trim()) return;
    if (!caseId) {
      Alert.alert(i18n.t("publish_first"), i18n.t("publish_before_comment"));
      return;
    }
    if (containsBadWords(commentInput)) {
      Alert.alert(i18n.t("invalid_message"), i18n.t("message_contains_bad_words"));
      return;
    }
    try {
      const text = replyTo ? `@${replyTo.slice(0, 6)} ${commentInput}` : commentInput;
      await createComment(text);
      setCommentInput("");
      setReplyTo(null);
    } catch {
      Alert.alert(i18n.t("error"), i18n.t("send_comment_failed"));
    }
  }

  async function onAiAnalyze() {
    setAiLoading(true);
    setAiText("");
    setAiReason("");
    setAiConfidence(null);
    setTimeout(() => {
      const analysis = getAiStubAnalysis(organ, answers);
      setAiLoading(false);
      setAiText(analysis.text);
      setAiConfidence(analysis.confidence);
      setAiReason(analysis.reason);
    }, 1200);
  }

  function openReportDialog(targetId: string, targetType: "case" | "comment") {
    if (!user?.id) {
      Alert.alert(i18n.t("error"), i18n.t("load_error"));
      return;
    }
    const reasons: Array<{ value: ReportReason; label: string }> = [
      { value: "spam", label: i18n.t("report_reason_spam") },
      { value: "abuse", label: i18n.t("report_reason_abuse") },
      { value: "other", label: i18n.t("report_reason_other") },
    ];
    Alert.alert(i18n.t("report"), i18n.t("report_choose_reason"), [
      ...reasons.map((reason) => ({
        text: reason.label,
        onPress: async () => {
          await reportContent({
            targetId,
            targetType,
            reason: reason.value,
            userId: user.id,
          });
          Alert.alert(i18n.t("success"), i18n.t("report_sent"));
        },
      })),
      { text: i18n.t("cancel"), style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{i18n.t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{i18n.t("case_title")}</Text>
        <Pressable
          style={styles.moreBtn}
          onPress={() => Alert.alert(i18n.t("menu"), i18n.t("edit_delete_stub"))}
        >
          <Text style={styles.moreBtnText}>⋯</Text>
        </Pressable>
      </View>
      <Text style={[styles.userBadge, isPro && styles.userBadgePro]}>
        {user?.name ?? i18n.t("doctor")} · {i18n.t("level_short")} {user?.level ?? 1} {stars} · {user?.points ?? 0} {i18n.t("points_short")}
      </Text>
      <View style={{ marginBottom: 10 }}>
        <ProBadge isPro={isPro} compact />
      </View>
      {showOfflineBanner ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{i18n.t("offline_banner")}</Text>
          <Pressable
            style={styles.offlineRetryBtn}
            onPress={() => {
              setCaseReloadKey((v) => v + 1);
              void reloadComments();
            }}
          >
            <Text style={styles.offlineRetryText}>{i18n.t("retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {!isCreateMode ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("image")}</Text>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>{i18n.t("no_image")}</Text>
              </View>
            )}
          </View>
        ) : null}

        {!isCreateMode ? (
          <View style={[styles.card, styles.resultMedium]}>
            <Text style={styles.cardTitle}>{i18n.t("classification")}</Text>
            <Text style={styles.resultCategory}>{result.category}</Text>
            <Text style={styles.resultText}>{result.text}</Text>
          </View>
        ) : null}

        {!isCreateMode ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("description")}</Text>
            <Text style={styles.summaryText}>{description || "—"}</Text>
          </View>
        ) : null}

        {!isCreateMode ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("signs")}</Text>
            <View style={styles.signTable}>
              {questions.map((q) => (
                <View key={q.id} style={styles.signRow}>
                  <Text style={styles.signKey}>{i18n.t(q.titleKey)}</Text>
                  <Text style={styles.signValue}>{answers[q.id] ? i18n.t(answers[q.id]) : "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isCreateMode ? (
          <View style={styles.card}>
            <Pressable style={styles.primaryBtn} onPress={onAiAnalyze}>
              <Text style={styles.primaryBtnText}>{i18n.t("get_ai_opinion")}</Text>
            </Pressable>
            {aiLoading ? <ActivityIndicator color="#0ea5a4" /> : null}
            <View style={styles.aiCard}>
              <Text style={styles.aiIcon}>🤖</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.aiTopRow}>
                  <Text style={styles.aiBetaBadge}>{i18n.t("ai_beta_badge")}</Text>
                </View>
                <Text style={styles.aiText}>{aiText || i18n.t("ai_suggests_placeholder")}</Text>
                {aiConfidence !== null ? (
                  <Text
                    style={[
                      styles.aiMeta,
                      aiConfidenceTone === "high" && styles.aiMetaHigh,
                      aiConfidenceTone === "medium" && styles.aiMetaMedium,
                      aiConfidenceTone === "low" && styles.aiMetaLow,
                    ]}
                  >
                    {i18n.t("ai_confidence", { value: aiConfidence })}
                  </Text>
                ) : null}
                {aiReason ? <Text style={styles.aiReason}>{aiReason}</Text> : null}
                <Text style={styles.aiHint}>{i18n.t("ai_assistive_hint")}</Text>
                {aiText ? (
                  <Pressable
                    style={styles.aiUseBtn}
                    onPress={() =>
                      setDescription((prev) =>
                        prev.trim()
                          ? `${prev.trim()} ${i18n.t("ai_summary_label")}: ${aiText}.`
                          : `${i18n.t("ai_summary_label")}: ${aiText}.`
                      )
                    }
                  >
                    <Text style={styles.aiUseBtnText}>{i18n.t("ai_add_to_description")}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {isCreateMode ? (
          <>
            <View style={styles.stepperRow}>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
              ))}
            </View>
            <Text style={styles.stepLabel}>{i18n.t("step_of", { step })}</Text>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("step_organ")}</Text>
            <View style={styles.organRow}>
              {(["breast", "ovary", "uterus", "lymph"] as OrganType[]).map((item) => (
                <Pressable
                  key={item}
                  style={[styles.organChip, organ === item && styles.organChipActive]}
                  onPress={() => {
                    setOrgan(item);
                    setAnswers({});
                  }}
                >
                  <Text style={[styles.organChipText, organ === item && styles.organChipTextActive]}>
                    {item === "breast" ? i18n.t("breast") : item === "ovary" ? i18n.t("ovary") : item === "uterus" ? i18n.t("uterus") : i18n.t("lymph_node")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={[styles.card, isPro && styles.cardPro]}>
            <Text style={styles.cardTitle}>{i18n.t("step_images")}</Text>
            <Text style={styles.photoHint}>{i18n.t("photo_upload_hint")}</Text>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>{i18n.t("no_image")}</Text>
              </View>
            )}
            <View style={styles.photoBtnRow}>
              <Pressable style={styles.photoBtnPrimary} onPress={pickImage}>
                <Text style={styles.photoBtnPrimaryText}>{i18n.t("add_image_from_gallery")}</Text>
              </Pressable>
              <Pressable style={styles.photoBtnSecondary} onPress={pickImageFromCamera}>
                <Text style={styles.photoBtnSecondaryText}>{i18n.t("take_photo_camera")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("step_description")}</Text>
            {organ === "ovary" ? (
              <Pressable
                style={[styles.toggleWrap, autoFillOvaryDescription && styles.toggleWrapActive]}
                onPress={() => setAutoFillOvaryDescription((v) => !v)}
              >
                <View style={[styles.toggle, autoFillOvaryDescription && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, autoFillOvaryDescription && styles.toggleKnobActive]} />
                </View>
                <Text style={styles.toggleText}>
                  {i18n.t("auto_fill_ovary_description")}
                </Text>
              </Pressable>
            ) : null}
            <TextInput
              style={styles.inputMulti}
              multiline
              placeholder={i18n.t("description")}
              value={description}
              onChangeText={setDescription}
              editable={organ !== "ovary" || !autoFillOvaryDescription}
            />
            {organ === "ovary" && autoFillOvaryDescription ? (
              <Text style={styles.autoFillHint}>{i18n.t("auto_fill_ovary_description_hint")}</Text>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder={i18n.t("size_optional")}
              value={size}
              onChangeText={setSize}
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("step_signs")}</Text>
            <View style={styles.questionWrap}>
              {questions.map((q) => (
                <View key={q.id} style={styles.questionItem}>
                  <Text style={styles.questionTitle}>{i18n.t(q.titleKey)}</Text>
                  <View style={styles.optionsRow}>
                    {q.options.map((option) => (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionBtn,
                          answers[q.id] === option && styles.optionBtnActive,
                        ]}
                        onPress={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: option,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            answers[q.id] === option && styles.optionTextActive,
                          ]}
                        >
                          {i18n.t(option)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            {organ === "ovary" ? (
              <DescriptionBlock
                description={autoDescription}
                keywords={autoDescriptionKeywords}
                example={OVARIAN_DESCRIPTION_EXAMPLE}
                whyText={autoDescriptionWhy}
                onUseInCase={() => {
                  setDescription(autoDescription);
                  setAutoFillOvaryDescription(false);
                }}
              />
            ) : null}
          </View>
        ) : null}

        {step === 5 ? (
          <View
            style={[
              styles.card,
              result.level === "low" && styles.resultLow,
              result.level === "medium" && styles.resultMedium,
              result.level === "high" && styles.resultHigh,
            ]}
          >
            <Text style={styles.cardTitle}>{i18n.t("step_classification")}</Text>
            <Text style={styles.resultCategory}>{result.category}</Text>
            <Text style={styles.resultText}>{result.text}</Text>
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t("step_publish")}</Text>
            <Text style={styles.summaryText}>{i18n.t("organ_label")}: {organ}</Text>
            <Text style={styles.summaryText}>{i18n.t("description")}: {description || "—"}</Text>
            <Text style={styles.summaryText}>{i18n.t("classification")}: {result.category}</Text>
            <Pressable style={styles.publishBtn} onPress={onPublishCase} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.publishBtnText}>{i18n.t("publish_case")}</Text>
              )}
            </Pressable>
            {caseId ? (
              <Pressable
                style={styles.reportBtn}
                onPress={() => openReportDialog(caseId, "case")}
              >
                <Text style={styles.reportBtnText}>{i18n.t("report")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

            <View style={styles.stepActions}>
              <Pressable
                style={[styles.stepBtn, step === 1 && styles.stepBtnDisabled]}
                onPress={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                <Text style={styles.stepBtnText}>{i18n.t("back")}</Text>
              </Pressable>
              <Pressable
                style={[styles.stepBtn, step === 6 && styles.stepBtnDisabled]}
                onPress={() => setStep((s) => Math.min(6, s + 1))}
                disabled={step === 6}
              >
                <Text style={styles.stepBtnText}>{i18n.t("next")}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {isCreateMode ? (
          <View style={styles.card}>
            <Pressable style={styles.secondaryBtn} onPress={onAiAnalyze}>
              <Text style={styles.secondaryBtnText}>{i18n.t("ai_analysis")}</Text>
            </Pressable>
            <View style={styles.aiTopRow}>
              <Text style={styles.aiBetaBadge}>{i18n.t("ai_beta_badge")}</Text>
            </View>
            {aiLoading ? <ActivityIndicator color="#0ea5a4" /> : null}
            {aiText ? <Text style={styles.aiText}>{aiText}</Text> : null}
            {aiConfidence !== null ? (
              <Text
                style={[
                  styles.aiMeta,
                  aiConfidenceTone === "high" && styles.aiMetaHigh,
                  aiConfidenceTone === "medium" && styles.aiMetaMedium,
                  aiConfidenceTone === "low" && styles.aiMetaLow,
                ]}
              >
                {i18n.t("ai_confidence", { value: aiConfidence })}
              </Text>
            ) : null}
            {aiReason ? <Text style={styles.aiReason}>{aiReason}</Text> : null}
            {aiText ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() =>
                  setDescription((prev) =>
                    prev.trim()
                      ? `${prev.trim()} ${i18n.t("ai_summary_label")}: ${aiText}.`
                      : `${i18n.t("ai_summary_label")}: ${aiText}.`
                  )
                }
              >
                <Text style={styles.secondaryBtnText}>{i18n.t("ai_add_to_description")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{i18n.t("comments")}</Text>
          {loadingCase || commentsLoading ? (
            <View style={styles.commentSkeletonWrap}>
              <View style={styles.commentSkeleton} />
              <View style={styles.commentSkeleton} />
            </View>
          ) : null}
          {comments.map((comment) => (
            <View
              key={comment.id}
              style={[
                styles.commentItem,
                comment.text.startsWith("@") && styles.replyItem,
              ]}
            >
              <View style={styles.commentHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>DR</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentDoctor}>{i18n.t("doctor")}</Text>
                  <Text style={styles.commentTime}>2h ago</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
              <View style={styles.commentTools}>
                <Pressable
                  onPress={() => setReplyTo(comment.userId || comment.id)}
                  style={styles.commentToolBtn}
                >
                  <Text style={styles.commentToolText}>{i18n.t("reply")}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setCommentLikes((prev) => ({
                      ...prev,
                      [comment.id]: (prev[comment.id] || 0) + 1,
                    }))
                  }
                  style={styles.commentToolBtn}
                >
                  <Text style={styles.commentToolText}>❤️ {commentLikes[comment.id] || 0}</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.commentReportBtn}
                onPress={() => openReportDialog(comment.id, "comment")}
              >
                <Text style={styles.commentReportBtnText}>{i18n.t("report")}</Text>
              </Pressable>
            </View>
          ))}
          {!caseId ? (
            <Text style={styles.commentHint}>{i18n.t("comments_after_publish")}</Text>
          ) : null}
          <View style={styles.commentRow}>
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? i18n.t("reply_to", { id: replyTo.slice(0, 6) }) : i18n.t("write_comment")}
              value={commentInput}
              onChangeText={setCommentInput}
            />
            <Pressable style={styles.sendBtn} onPress={onSendComment} disabled={commentSaving}>
              {commentSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>{i18n.t("send")}</Text>
              )}
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  content: { gap: 18, paddingBottom: 30 },
  stepperRow: { flexDirection: "row", gap: 6, justifyContent: "center" },
  stepDot: {
    width: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
  },
  stepDotActive: { backgroundColor: "#0f766e" },
  stepLabel: { textAlign: "center", color: "#64748b", fontSize: 12, marginBottom: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnText: { color: "#0f172a", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", flex: 1 },
  userBadge: { marginBottom: 10, color: "#475569", fontSize: 12 },
  userBadgePro: { color: "#a16207" },
  offlineBanner: {
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offlineText: { color: "#b91c1c", fontSize: 12, fontWeight: "600" },
  offlineRetryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offlineRetryText: { color: "#b91c1c", fontSize: 12, fontWeight: "700" },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtnText: { fontSize: 22, lineHeight: 22, color: "#334155" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  cardPro: {
    borderColor: "#f5d487",
    backgroundColor: "#fffdf6",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  image: { width: "100%", height: 210, borderRadius: 12, backgroundColor: "#e2e8f0" },
  imagePlaceholder: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#64748b" },
  photoHint: { fontSize: 13, color: "#64748b", lineHeight: 19, marginBottom: 4 },
  photoBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  photoBtnPrimary: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    alignItems: "center",
  },
  photoBtnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  photoBtnSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0f766e",
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
  },
  photoBtnSecondaryText: { color: "#0f766e", fontWeight: "800", fontSize: 14 },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#0f172a", fontWeight: "600" },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: "#0ea5a4",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  organRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  organChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  organChipActive: { backgroundColor: "#0ea5a4", borderColor: "#0ea5a4" },
  organChipText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  organChipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
  },
  inputMulti: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    textAlignVertical: "top",
  },
  toggleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toggleWrapActive: { borderColor: "#99f6e4", backgroundColor: "#f0fdfa" },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: "#0f766e" },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  toggleKnobActive: { alignSelf: "flex-end" },
  toggleText: { color: "#0f172a", fontSize: 12, fontWeight: "600" },
  autoFillHint: { color: "#0f766e", fontSize: 12 },
  questionWrap: { gap: 10 },
  questionItem: { gap: 6 },
  questionTitle: { fontWeight: "600", color: "#0f172a" },
  optionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optionBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: "#fff",
  },
  optionBtnActive: { borderColor: "#0ea5a4", backgroundColor: "#ccfbf1" },
  optionText: { color: "#334155", fontSize: 12 },
  optionTextActive: { color: "#0f766e", fontWeight: "700" },
  resultLow: { borderColor: "#86efac", backgroundColor: "#f0fdf4" },
  resultMedium: { borderColor: "#fde68a", backgroundColor: "#fffbeb" },
  resultHigh: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  resultCategory: { fontWeight: "800", fontSize: 18, color: "#0f172a" },
  resultText: { color: "#334155" },
  signTable: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  signKey: { color: "#475569", fontSize: 13 },
  signValue: { color: "#0f172a", fontSize: 13, fontWeight: "600" },
  aiText: { color: "#334155" },
  aiTopRow: { marginTop: 2, marginBottom: 4, flexDirection: "row" },
  aiBetaBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#fff",
    color: "#1d4ed8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  aiMeta: { marginTop: 4, color: "#0369a1", fontSize: 12, fontWeight: "700" },
  aiMetaHigh: { color: "#15803d" },
  aiMetaMedium: { color: "#a16207" },
  aiMetaLow: { color: "#b91c1c" },
  aiReason: { marginTop: 4, color: "#334155", fontSize: 12 },
  aiCard: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  aiIcon: { fontSize: 18 },
  aiHint: { marginTop: 4, color: "#64748b", fontSize: 12 },
  aiUseBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiUseBtnText: { color: "#1d4ed8", fontSize: 12, fontWeight: "700" },
  commentSkeletonWrap: { gap: 8 },
  commentSkeleton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  commentItem: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  replyItem: { marginLeft: 20, borderColor: "#cbd5e1" },
  commentHeader: { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "center" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1E88E5", fontSize: 10, fontWeight: "700" },
  commentDoctor: { color: "#0f172a", fontSize: 12, fontWeight: "700" },
  commentTime: { color: "#6B7280", fontSize: 11 },
  commentText: { color: "#334155" },
  commentTools: { marginTop: 8, flexDirection: "row", gap: 8 },
  commentToolBtn: {
    borderWidth: 1,
    borderColor: "#dbe2ea",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  commentToolText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  commentHint: { color: "#64748b", fontSize: 12 },
  commentRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sendBtn: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  stepActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  stepBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnText: { color: "#0f172a", fontWeight: "600" },
  summaryText: { color: "#334155", fontSize: 13 },
  reportBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    paddingVertical: 10,
    alignItems: "center",
  },
  reportBtnText: { color: "#b91c1c", fontWeight: "700" },
  commentReportBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  commentReportBtnText: { color: "#b91c1c", fontSize: 12, fontWeight: "600" },
  publishBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#0f766e",
    alignItems: "center",
  },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
