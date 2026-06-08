import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/AppStack";
import i18n, { changeLanguage, type AppLanguage } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Language">;

const LANG_OPTIONS: Array<{ id: AppLanguage; label: string }> = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];

export default function LanguageScreen({ navigation }: Props) {
  const [saving, setSaving] = useState(false);

  async function onSelectLanguage(lang: AppLanguage) {
    try {
      setSaving(true);
      await changeLanguage(lang);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{i18n.t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{i18n.t("language")}</Text>
      </View>

      <View style={styles.list}>
        {LANG_OPTIONS.map((lang) => (
          <Pressable
            key={lang.id}
            style={[styles.option, i18n.locale.startsWith(lang.id) && styles.optionActive]}
            onPress={() => onSelectLanguage(lang.id)}
            disabled={saving}
          >
            <Text style={styles.optionText}>{lang.label}</Text>
          </Pressable>
        ))}
      </View>

      {saving ? <ActivityIndicator color="#0f766e" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnText: { color: "#0f172a", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  list: { gap: 10 },
  option: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  optionActive: { borderColor: "#0f766e", backgroundColor: "#f0fdfa" },
  optionText: { color: "#0f172a", fontSize: 16, fontWeight: "600" },
});
