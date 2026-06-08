import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { branding } from "../config/branding";
import { LEGAL_PUBLIC_URLS, legalPublicUrlsAreConfigured } from "../config/legalUrls";
import { saveConsent } from "../legal/consentStorage";
import i18n from "../i18n";
import type { RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Consent">;

const VIOLET = "#6D28D9";

function CheckboxRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export default function ConsentScreen({ navigation }: Props) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [ai, setAi] = useState(false);
  const [saving, setSaving] = useState(false);

  const allOk = terms && privacy && ai;

  async function onContinue() {
    if (!allOk) return;
    try {
      setSaving(true);
      await saveConsent({
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedAiAuxiliary: true,
        acceptedAt: Date.now(),
      });
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e) {
      Alert.alert(i18n.t("error"), e instanceof Error ? e.message : "Не удалось сохранить согласие");
    } finally {
      setSaving(false);
    }
  }

  const urlsLive = legalPublicUrlsAreConfigured();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{i18n.t("legal_consent_before_use_title")}</Text>
        <Text style={styles.heroSub}>Первый запуск</Text>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.intro}>{i18n.t("legal_consent_intro")}</Text>

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate("TermsOfUse")} style={styles.linkPill}>
            <Text style={styles.link}>{i18n.t("legal_consent_read_terms")}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("PrivacyPolicy")} style={styles.linkPill}>
            <Text style={styles.link}>{i18n.t("legal_consent_read_privacy")}</Text>
          </Pressable>
          {urlsLive ? (
            <>
              <Pressable onPress={() => void Linking.openURL(LEGAL_PUBLIC_URLS.privacyPolicy)}>
                <Text style={styles.linkMuted}>{i18n.t("legal_open_external")}: {i18n.t("legal_url_privacy_label")}</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(LEGAL_PUBLIC_URLS.termsOfUse)}>
                <Text style={styles.linkMuted}>{i18n.t("legal_open_external")}: {i18n.t("legal_url_terms_label")}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.placeholderHint} selectable>
              {i18n.t("legal_url_placeholder_hint")}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomPanel}>
        <Text style={styles.sectionLabel}>{i18n.t("legal_consent_checks_header")}</Text>
        <CheckboxRow checked={terms} onToggle={() => setTerms((v) => !v)} label={i18n.t("legal_consent_cb_terms")} />
        <CheckboxRow checked={privacy} onToggle={() => setPrivacy((v) => !v)} label={i18n.t("legal_consent_cb_privacy")} />
        <CheckboxRow checked={ai} onToggle={() => setAi((v) => !v)} label={i18n.t("legal_consent_cb_ai")} />

        <Pressable style={[styles.cta, (!allOk || saving) && styles.ctaDisabled]} onPress={onContinue} disabled={!allOk || saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{i18n.t("legal_consent_continue")}</Text>}
        </Pressable>
        <Text style={styles.hint}>{i18n.t("legal_consent_public_doc_hint")}</Text>
        <Text style={styles.owner}>{i18n.t("product_owner")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  hero: {
    backgroundColor: VIOLET,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 26 },
  heroSub: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.85)", marginTop: 6, letterSpacing: 0.5 },
  scrollFlex: { flex: 1 },
  scroll: { padding: theme.spacing.md, paddingBottom: 16 },
  bottomPanel: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 14,
  },
  placeholderHint: { fontSize: 12, color: "#64748b", lineHeight: 18, marginTop: 4 },
  intro: { fontSize: 15, lineHeight: 23, color: "#334155", fontWeight: "500" },
  links: { marginTop: 16, marginBottom: 8, gap: 10 },
  linkPill: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  link: { fontSize: 14, fontWeight: "700", color: VIOLET },
  linkMuted: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  sectionLabel: {
    marginTop: 2,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 2,
  },
  checkboxOn: { borderColor: VIOLET, backgroundColor: "#f5f3ff" },
  checkmark: { color: VIOLET, fontWeight: "900", fontSize: 14 },
  checkboxLabel: { flex: 1, fontSize: 15, lineHeight: 22, color: "#0f172a", fontWeight: "600" },
  hint: { fontSize: 11, color: "#64748b", lineHeight: 17, marginTop: 8, marginBottom: 2 },
  cta: {
    marginTop: 14,
    backgroundColor: VIOLET,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  owner: { textAlign: "center", marginTop: 6, fontSize: 11, color: "#94a3b8" },
});
