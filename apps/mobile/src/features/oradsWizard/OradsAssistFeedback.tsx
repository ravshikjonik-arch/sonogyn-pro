import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { submitOradsEventFeedback } from "./oradsEventsApi";

type Props = {
  eventId: string | null;
  aiCategoryNumber: number | null;
  manualCategoryNumber?: number | null;
};

export default function OradsAssistFeedback({ eventId, aiCategoryNumber, manualCategoryNumber }: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCategory, setManualCategory] = useState<number | null>(manualCategoryNumber ?? null);

  if (!eventId) return null;
  if (done) {
    return <Text style={styles.done}>Спасибо! Отзыв сохранён.</Text>;
  }

  async function submit(correct: boolean) {
    if (!eventId) return;
    if (!correct && manualCategory === null) {
      setShowManual(true);
      return;
    }

    setPending(true);
    setError(null);
    const category = correct
      ? aiCategoryNumber ?? manualCategoryNumber ?? undefined
      : manualCategory ?? manualCategoryNumber ?? undefined;

    const ok = await submitOradsEventFeedback(eventId, {
      feedbackCorrect: correct,
      manualCategoryNumber:
        category !== null && category !== undefined && category >= 1 && category <= 5
          ? category
          : undefined,
    });
    setPending(false);
    if (ok) setDone(true);
    else setError("Не удалось сохранить отзыв.");
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>
        Правильно ли AI определил категорию
        {aiCategoryNumber !== null ? ` (O-RADS ${aiCategoryNumber})` : ""}?
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} disabled={pending} onPress={() => void submit(true)}>
          <Text style={styles.btnText}>Да</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnOutline]} disabled={pending} onPress={() => setShowManual(true)}>
          <Text style={styles.btnTextOutline}>Нет</Text>
        </Pressable>
      </View>
      {showManual ? (
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, manualCategory === n && styles.chipActive]}
              onPress={() => setManualCategory(n)}
            >
              <Text style={[styles.chipText, manualCategory === n && styles.chipTextActive]}>{n}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.btn, manualCategory === null && styles.btnDisabled]}
            disabled={pending || manualCategory === null}
            onPress={() => void submit(false)}
          >
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </View>
      ) : null}
      {manualCategoryNumber ? (
        <Text style={styles.hint}>В wizard: O-RADS {manualCategoryNumber}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  btn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnOutline: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#CBD5E1" },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnTextOutline: { color: "#334155", fontWeight: "700", fontSize: 13 },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { fontWeight: "800", color: "#334155" },
  chipTextActive: { color: "#fff" },
  hint: { marginTop: 6, fontSize: 11, color: "#64748b" },
  error: { marginTop: 6, fontSize: 12, color: "#DC2626" },
  done: { fontSize: 12, fontWeight: "600", color: "#059669", marginTop: 8 },
});
