import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { formatAgeYearsRu } from "@repo/types";
import type { UseOradsNavigatorReturn } from "@repo/orads-us";

import OradsAssistFeedback from "./OradsAssistFeedback";
import { useOradsAssist } from "./useOradsAssist";

type Props = {
  nav: UseOradsNavigatorReturn;
  profileAgeYears?: number;
  patientId?: string;
  onApplyStepper?: () => void;
};

const FEATURE_LABELS: Record<string, string> = {
  diameterMm: "Макс. размер",
  solidComponent: "Солидный компонент",
  vascularity: "Кровоток",
  septations: "Перегородки",
  ascites: "Асцит",
  contour: "Контуры",
  lesionClass: "Тип образования",
};

export default function OradsAssistPanel({
  nav,
  profileAgeYears,
  patientId,
  onApplyStepper,
}: Props) {
  const [text, setText] = useState("");
  const [menopause, setMenopause] = useState<"pre" | "post">("pre");
  const { analyze, result, loading, error, reset, eventId } = useOradsAssist();

  const manualCategory = nav.view.kind === "result" ? nav.view.result.categoryNumber : null;

  const features = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.extracted).filter(([k, v]) => v !== undefined && k !== "sourceText");
  }, [result]);

  async function onAnalyze(fetchRemoteDraft = false) {
    await analyze({ text, menopause, profileAgeYears, patientId, fetchRemoteDraft });
  }

  function onApplyHints(autoHighOnly: boolean) {
    if (!result?.hints.length) return;
    nav.applyHints(result.hints, autoHighOnly);
    onApplyStepper?.();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>
        Вставьте фрагмент протокола. Категорию O-RADS считает калькулятор после вашего подтверждения.
      </Text>

      {profileAgeYears !== undefined ? (
        <Text style={styles.profileAge}>Возраст из профиля: {formatAgeYearsRu(profileAgeYears)}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Киста левого яичника 40 мм, гладкие контуры…"
        placeholderTextColor="#94A3B8"
      />

      <View style={styles.row}>
        <Text style={styles.label}>Менопауза</Text>
        {(["pre", "post"] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, menopause === m && styles.chipActive]}
            onPress={() => setMenopause(m)}
          >
            <Text style={[styles.chipText, menopause === m && styles.chipTextActive]}>
              {m === "pre" ? "Пре" : "Пост"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.primaryBtn, (loading || !text.trim()) && styles.btnDisabled]}
          disabled={loading || !text.trim()}
          onPress={() => void onAnalyze()}
        >
          <Text style={styles.primaryBtnText}>{loading ? "Разбор…" : "Разобрать"}</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={() => { reset(); setText(""); }}>
          <Text style={styles.ghostBtnText}>Очистить</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Извлечённые признаки</Text>
          {features.map(([k, v]) => (
            <Text key={k} style={styles.featureLine}>
              <Text style={styles.featureKey}>{FEATURE_LABELS[k] ?? k}: </Text>
              {String(v)}
            </Text>
          ))}
          {result.context.postMenopauseHint ? (
            <Text style={styles.hint}>
              Подсказка: возраст ≥50 — уточните менопаузу (не меняем автоматически).
            </Text>
          ) : null}
          {result.categoryNumber !== null ? (
            <Text style={styles.category}>Черновик: O-RADS {result.categoryNumber}</Text>
          ) : (
            <Text style={styles.hint}>
              Не все шаги определены{result.unresolvedNodes.length ? `: ${result.unresolvedNodes.join(", ")}` : ""}
            </Text>
          )}
          {result.protocolDraft ? (
            <Text style={styles.draft} numberOfLines={8}>
              Черновик ({result.protocolDraftSource}): {result.protocolDraft}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => onApplyHints(true)}>
              <Text style={styles.secondaryBtnText}>Заполнить (high)</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => onApplyHints(false)}>
              <Text style={styles.primaryBtnText}>В wizard</Text>
            </Pressable>
          </View>
          <OradsAssistFeedback
            eventId={eventId}
            aiCategoryNumber={result.categoryNumber}
            manualCategoryNumber={manualCategory}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 24, gap: 10 },
  lead: { fontSize: 13, lineHeight: 18, color: "#475569" },
  profileAge: { fontSize: 12, fontWeight: "700", color: "#6D28D9" },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  label: { fontSize: 12, fontWeight: "700", color: "#475569" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextActive: { color: "#fff" },
  primaryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtn: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#1E293B", fontWeight: "700", fontSize: 13 },
  ghostBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  ghostBtnText: { color: "#64748B", fontWeight: "600", fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  error: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
  resultBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    gap: 6,
  },
  resultTitle: { fontSize: 12, fontWeight: "800", color: "#5B21B6", textTransform: "uppercase" },
  featureLine: { fontSize: 12, color: "#334155" },
  featureKey: { fontWeight: "700" },
  category: { fontSize: 15, fontWeight: "900", color: "#1D4ED8", marginTop: 4 },
  hint: { fontSize: 12, color: "#B45309" },
  draft: { fontSize: 11, color: "#475569", marginTop: 4 },
});
