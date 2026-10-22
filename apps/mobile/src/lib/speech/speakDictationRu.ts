import * as Speech from "expo-speech";

export function speakDictationRu(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  Speech.stop();
  Speech.speak(trimmed, {
    language: "ru-RU",
    rate: 0.95,
  });
}
