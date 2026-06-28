import { CLINICAL_3D_LOCALES } from "@repo/clinical-3d";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/AppStack";
import i18n, { changeLanguage, isAppLanguage, type AppLanguage } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Language">;

export default function LanguageScreen({ navigation }: Props) {
  const [saving, setSaving] = useState(false);

  const langOptions = useMemo((): Array<{ id: AppLanguage; label: string }> => {
    const base: Array<{ id: AppLanguage; label: string }> = CLINICAL_3D_LOCALES.map((l) => ({
      id: l.code as AppLanguage,
      label: l.label,
    }));
    if (!base.some((o) => o.id === "es")) {
      base.push({ id: "es", label: "Español" });
    }
    return base;
  }, []);

  async function onSelectLanguage(lang: AppLanguage) {
    try {
      setSaving(true);
      await changeLanguage(lang);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  const current = i18n.locale.split("-")[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{i18n.t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{i18n.t("language")}</Text>
      </View>

      <Text style={styles.note}>Базовый язык — русский. FR / IT / AR пока с fallback на RU.</Text>

      <View style={styles.list}>
        {langOptions.map((lang) => (
          <Pressable
            key={lang.id}
            style={[styles.option, current === lang.id && styles.optionActive]}
            onPress={() => {
              if (isAppLanguage(lang.id)) void onSelectLanguage(lang.id);
            }}
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
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
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
  note: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 18 },
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
