import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { branding } from "../../../config/branding";
import { theme } from "../../../theme";
import {
  analyzeThyroidTextLocally,
  requestThyroidAiAssist,
  TIRADS_AI_EXAMPLE,
  type ThyroidAiAssistResult,
} from "../ai/thyroidAiService";

type Props = {
  onApply: (result: ThyroidAiAssistResult) => void;
};

function guessMime(uri: string, pickerMime?: string | null): string {
  if (pickerMime?.startsWith("image/")) return pickerMime;
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function fileNameFromUri(uri: string): string {
  const part = uri.split("/").pop() ?? "thyroid-us.jpg";
  return part.includes(".") ? part : `${part}.jpg`;
}

export default function TiradsAiPanel({ onApply }: Props) {
  const [text, setText] = useState("");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ThyroidAiAssistResult | null>(null);

  async function analyzeText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      setResult(await requestThyroidAiAssist({ freeText: trimmed }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка анализа";
      if (msg.includes("API_BASE") || msg.includes("network")) {
        setResult(analyzeThyroidTextLocally(trimmed));
        Alert.alert("Офлайн NLP", "Сервер недоступен — локальный rule engine ACR TI-RADS.");
      } else {
        Alert.alert("Ошибка", msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function pickAndAnalyze(source: "library" | "camera") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Нет доступа", source === "camera" ? "Разрешите камеру." : "Разрешите доступ к фото.");
      return;
    }

    const picked =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          });

    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    if (!asset.base64) {
      Alert.alert("Ошибка", "Не удалось прочитать снимок (base64).");
      return;
    }

    setPreviewUri(asset.uri);
    setBusy(true);
    try {
      const frame = {
        fileName: fileNameFromUri(asset.uri),
        mimeType: guessMime(asset.uri, asset.mimeType),
        base64: asset.base64,
      };
      setResult(
        await requestThyroidAiAssist({
          freeText: text.trim() || undefined,
          frames: [frame],
        }),
      );
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось проанализировать снимок");
    } finally {
      setBusy(false);
    }
  }

  async function copyProtocol() {
    if (!result) return;
    await Clipboard.setStringAsync(result.report.fullProtocol);
    Alert.alert("Скопировано", "Протокол в буфере обмена.");
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Текст или снимок УЗИ → US AI Worker + rule engine ACR TI-RADS (сервер SonoGyn).
      </Text>

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Снимок УЗИ ЩЖ</Text>
        <View style={styles.uploadRow}>
          <Pressable style={styles.uploadBtn} disabled={busy} onPress={() => void pickAndAnalyze("library")}>
            <Text style={styles.uploadBtnText}>Галерея</Text>
          </Pressable>
          <Pressable style={styles.uploadBtn} disabled={busy} onPress={() => void pickAndAnalyze("camera")}>
            <Text style={styles.uploadBtnText}>Камера</Text>
          </Pressable>
        </View>
        {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" /> : null}
      </View>

      <TextInput
        style={styles.textArea}
        multiline
        placeholder={TIRADS_AI_EXAMPLE}
        placeholderTextColor="#94a3b8"
        value={text}
        onChangeText={setText}
      />

      <View style={styles.actions}>
        <Pressable style={[styles.primary, (!text.trim() || busy) && styles.disabled]} disabled={!text.trim() || busy} onPress={() => void analyzeText()}>
          <Text style={styles.primaryText}>{busy ? "Анализ…" : "Анализировать текст"}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setText(TIRADS_AI_EXAMPLE)}>
          <Text style={styles.secondaryText}>Пример PTC</Text>
        </Pressable>
      </View>

      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0284c7" />
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.diagnosis}>{result.suggestedDiagnosis}</Text>
          <View style={styles.badges}>
            <Text style={styles.badgeMain}>{result.report.result.category}</Text>
            <Text style={styles.badgeSub}>{result.report.result.totalPoints} pts</Text>
            <Text style={styles.badgePipe}>{result.pipeline}</Text>
          </View>
          <Text style={styles.fna}>{result.report.result.fnaRationale}</Text>
          {result.workerSummary ? <Text style={styles.worker}>{result.workerSummary}</Text> : null}
          {result.detectedKeywords.length ? (
            <Text style={styles.keywords}>{result.detectedKeywords.join(" · ")}</Text>
          ) : null}
          <Text style={styles.protocol} numberOfLines={12}>
            {result.report.fullProtocol}
          </Text>
          <View style={styles.resultActions}>
            <Pressable style={styles.applyBtn} onPress={() => onApply(result)}>
              <Text style={styles.applyText}>Применить к ACR Score</Text>
            </Pressable>
            <Pressable style={styles.copyBtn} onPress={() => void copyProtocol()}>
              <Text style={styles.copyText}>Копировать протокол</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>Не является диагнозом. Интерпретация — за специалистом.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  intro: { fontSize: 13, color: branding.colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  uploadCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderStyle: "dashed",
    backgroundColor: "#f0f9ff",
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  uploadTitle: { fontSize: 12, fontWeight: "800", color: "#0369a1" },
  uploadRow: { flexDirection: "row", gap: 8 },
  uploadBtn: {
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  uploadBtnText: { fontSize: 12, fontWeight: "800", color: "#0284c7" },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  primary: {
    backgroundColor: "#0284c7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondary: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  secondaryText: { color: branding.colors.text, fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.5 },
  loading: { paddingVertical: 16, alignItems: "center" },
  resultCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    ...theme.shadow.card,
    gap: 8,
  },
  diagnosis: { fontSize: 16, fontWeight: "900", color: "#0c4a6e", lineHeight: 22 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  badgeMain: {
    backgroundColor: "#0284c7",
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeSub: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    fontWeight: "800",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgePipe: { fontSize: 10, color: "#64748b", flex: 1 },
  fna: { fontSize: 13, color: "#0f172a", lineHeight: 19 },
  worker: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  keywords: { fontSize: 11, color: "#475569", lineHeight: 16 },
  protocol: { fontSize: 11, color: "#334155", lineHeight: 16, marginTop: 4 },
  resultActions: { gap: 8, marginTop: 8 },
  applyBtn: {
    backgroundColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  copyBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  copyText: { color: branding.colors.text, fontWeight: "700", fontSize: 13 },
  disclaimer: { fontSize: 10, color: "#94a3b8", marginTop: 4 },
});
