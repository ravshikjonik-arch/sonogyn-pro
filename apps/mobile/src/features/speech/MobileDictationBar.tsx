import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { appendDictationText } from "../../lib/speech/appendDictation";
import { speakDictationRu } from "../../lib/speech/speakDictationRu";
import { grantMobileCloudSttConsent, hasMobileCloudSttConsent } from "../../lib/speech/cloudSttConsent";
import { fetchSpeechTranscribeMeta, transcribeAudioFile } from "../../lib/speech/transcribeSpeechApi";

type Props = {
  value: string;
  onChange: (next: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function MobileDictationBar({ value, onChange, style }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [consent, setConsent] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    void (async () => {
      const [meta, stored] = await Promise.all([fetchSpeechTranscribeMeta(), hasMobileCloudSttConsent()]);
      setServerAvailable(Boolean(meta?.available));
      setConsent(stored);
      setNeedsConsent(Boolean(meta?.available) && !stored);
    })();
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError("Запись пуста.");
        return;
      }
      const raw = await transcribeAudioFile({ uri });
      const { text, sideEffect } = appendDictationText(value, raw);
      onChange(text);
      if (sideEffect === "read") speakDictationRu(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось распознать речь.");
    } finally {
      setBusy(false);
    }
  }, [onChange, recorder, value]);

  const startRecord = useCallback(async () => {
    setError(null);
    if (!serverAvailable) {
      setError("Серверная диктовка недоступна. Проверьте вход и EXPO_PUBLIC_API_BASE_URL.");
      return;
    }
    if (needsConsent && !consent) {
      setError("Подтвердите отправку аудио на сервер.");
      return;
    }
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError("Разрешите доступ к микрофону в настройках.");
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [consent, needsConsent, recorder, serverAvailable]);

  const toggle = useCallback(() => {
    if (busy) return;
    if (recState.isRecording) {
      void stopAndTranscribe();
    } else {
      void startRecord();
    }
  }, [busy, recState.isRecording, startRecord, stopAndTranscribe]);

  return (
    <View style={[styles.wrap, style]}>
      {needsConsent ? (
        <Pressable
          style={styles.consentRow}
          onPress={() => {
            void grantMobileCloudSttConsent().then(() => {
              setConsent(true);
              setNeedsConsent(false);
            });
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
        >
          <Ionicons name={consent ? "checkbox" : "square-outline"} size={20} color="#0c4a6e" />
          <Text style={styles.consentText}>
            Аудио уходит на сервер STT (Whisper). Не диктуйте ФИО, телефон и номера документов.
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.row}>
        <Pressable
          style={[styles.micBtn, recState.isRecording ? styles.micActive : null]}
          onPress={toggle}
          disabled={busy || !serverAvailable}
          accessibilityLabel={recState.isRecording ? "Остановить диктовку" : "Начать диктовку"}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={recState.isRecording ? "stop" : "mic"} size={22} color="#fff" />
          )}
        </Pressable>
        <Text style={styles.hint}>
          {recState.isRecording
            ? "Запись… нажмите стоп для расшифровки"
            : serverAvailable
              ? "Серверная диктовка (Whisper)"
              : "Диктовка: нужен вход и API"}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0c4a6e",
    alignItems: "center",
    justifyContent: "center",
  },
  micActive: { backgroundColor: "#dc2626" },
  hint: { flex: 1, fontSize: 12, color: "#475569" },
  error: { fontSize: 12, color: "#b45309" },
  consentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  consentText: { flex: 1, fontSize: 11, lineHeight: 16, color: "#334155" },
});
