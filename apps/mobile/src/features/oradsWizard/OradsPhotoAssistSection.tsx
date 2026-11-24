import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { requestGynUltrasoundAssist, type GynAssistApiResult } from "./gynAssistApi";

type Props = {
  menopause: "pre" | "post";
  profileAgeYears?: number;
  freeText?: string;
  onMergedText: (text: string) => void;
  onGynResult?: (result: GynAssistApiResult) => void;
  style?: StyleProp<ViewStyle>;
};

function guessMime(uri: string, pickerMime?: string | null): string {
  if (pickerMime?.startsWith("image/")) return pickerMime;
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function fileNameFromUri(uri: string): string {
  const part = uri.split("/").pop() ?? "adnex-us.jpg";
  return part.includes(".") ? part : `${part}.jpg`;
}

export function OradsPhotoAssistSection({
  menopause,
  profileAgeYears,
  freeText,
  onMergedText,
  onGynResult,
  style,
}: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [workerHint, setWorkerHint] = useState<string | null>(null);

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
            quality: 0.5,
            base64: true,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.48,
            base64: true,
            allowsEditing: false,
          });

    if (picked.canceled || !picked.assets[0]?.base64) {
      return;
    }

    const asset = picked.assets[0];
    setPreviewUri(asset.uri);
    setBusy(true);
    setWorkerHint(null);
    try {
      const result = await requestGynUltrasoundAssist({
        freeText: freeText?.trim() || undefined,
        menopause,
        profileAgeYears,
        frames: [
          {
            fileName: fileNameFromUri(asset.uri),
            mimeType: guessMime(asset.uri, asset.mimeType),
            base64: asset.base64,
          },
        ],
      });
      onMergedText(result.mergedText);
      onGynResult?.(result);
      const bits = [result.workerSummary, result.workerImpression].filter(Boolean).join(" ");
      setWorkerHint(bits || result.pipeline);
    } catch (e) {
      Alert.alert(
        "Анализ снимка",
        e instanceof Error ? e.message : "Не удалось выполнить анализ. Проверьте сеть и sonogyn-pro.ru.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>Снимок УЗИ (обезличенный)</Text>
      <Text style={styles.disclaimer}>
        Серверная подсказка по признакам. Не диагноз; категорию O-RADS подтверждает врач в пошаговом
        калькуляторе.
      </Text>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} accessibilityLabel="Превью снимка" />
      ) : null}
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, busy && styles.btnDisabled]}
          disabled={busy}
          onPress={() => void pickAndAnalyze("library")}
          accessibilityRole="button"
          accessibilityLabel="Выбрать снимок из галереи"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Галерея</Text>}
        </Pressable>
        <Pressable
          style={[styles.btnSecondary, busy && styles.btnDisabled]}
          disabled={busy}
          onPress={() => void pickAndAnalyze("camera")}
          accessibilityRole="button"
          accessibilityLabel="Снять обезличенное изображение"
        >
          <Text style={styles.btnSecondaryText}>Камера</Text>
        </Pressable>
      </View>
      {workerHint ? (
        <Text style={styles.hint} numberOfLines={4}>
          {workerHint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    padding: 12,
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: "800", color: "#0c4a6e" },
  disclaimer: { fontSize: 11, lineHeight: 16, color: "#475569" },
  preview: { width: "100%", height: 140, borderRadius: 8, backgroundColor: "#e2e8f0" },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    backgroundColor: "#0f2744",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0f2744",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnSecondaryText: { color: "#0f2744", fontWeight: "700", fontSize: 13 },
  hint: { fontSize: 12, color: "#334155", lineHeight: 17 },
});