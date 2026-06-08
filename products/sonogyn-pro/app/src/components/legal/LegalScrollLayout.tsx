import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { branding } from "../../config/branding";
import { LEGAL_PUBLIC_URLS, legalPublicUrlsAreConfigured } from "../../config/legalUrls";
import { LEGAL_CONSENT_VERSION } from "../../legal/consentStorage";
import i18n from "../../i18n";
import { theme } from "../../theme";

type Props = {
  titleKey: string;
  bodyKey: string;
  navigation: { goBack: () => void };
  showPublicUrls?: boolean;
};

function splitLegalBody(raw: string): string[] {
  return raw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function LegalScrollLayout({ titleKey, bodyKey, navigation, showPublicUrls }: Props) {
  const paragraphs = splitLegalBody(i18n.t(bodyKey));
  const urlsLive = legalPublicUrlsAreConfigured();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {i18n.t(titleKey)}
        </Text>
        <View style={styles.backPlaceholder} />
      </View>
      <Text style={styles.meta}>
        {i18n.t("legal_doc_effective")}: v{LEGAL_CONSENT_VERSION} · {__DEV__ ? "dev" : "prod"}
      </Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator
        removeClippedSubviews={Platform.OS === "android"}
        overScrollMode="never"
      >
        {paragraphs.map((para, idx) => (
          <Text key={`p-${idx}`} style={[styles.body, idx > 0 && styles.bodyGap]}>
            {para}
          </Text>
        ))}
        {showPublicUrls ? (
          <View style={styles.urls}>
            <Text style={styles.urlLabel}>{i18n.t("legal_url_privacy_label")}</Text>
            {urlsLive ? (
              <Pressable onPress={() => void Linking.openURL(LEGAL_PUBLIC_URLS.privacyPolicy)}>
                <Text style={styles.url}>{LEGAL_PUBLIC_URLS.privacyPolicy}</Text>
              </Pressable>
            ) : (
              <Text style={styles.urlDisabled} selectable>
                {LEGAL_PUBLIC_URLS.privacyPolicy}
              </Text>
            )}
            <Text style={[styles.urlLabel, styles.urlSpacer]}>{i18n.t("legal_url_terms_label")}</Text>
            {urlsLive ? (
              <Pressable onPress={() => void Linking.openURL(LEGAL_PUBLIC_URLS.termsOfUse)}>
                <Text style={styles.url}>{LEGAL_PUBLIC_URLS.termsOfUse}</Text>
              </Pressable>
            ) : (
              <Text style={styles.urlDisabled} selectable>
                {LEGAL_PUBLIC_URLS.termsOfUse}
              </Text>
            )}
            <Text style={styles.hint}>{i18n.t("legal_consent_public_doc_hint")}</Text>
          </View>
        ) : null}
        <Text style={styles.footer}>{i18n.t("legal_not_device_footer")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    backgroundColor: "#fff",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  backPlaceholder: { width: 40 },
  backText: { fontSize: 18, color: theme.colors.text, fontWeight: "600" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: branding.colors.text, paddingHorizontal: 6 },
  meta: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, fontSize: 11, color: branding.colors.textSecondary },
  scroll: { padding: theme.spacing.md, paddingBottom: 40 },
  body: { fontSize: 15, lineHeight: 24, color: branding.colors.text },
  bodyGap: { marginTop: 14 },
  urls: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8ecf1",
  },
  urlLabel: { fontSize: 12, fontWeight: "700", color: branding.colors.textSecondary },
  urlSpacer: { marginTop: 12 },
  url: { marginTop: 4, fontSize: 13, color: branding.colors.primary, fontWeight: "600" },
  urlDisabled: { marginTop: 4, fontSize: 12, color: "#94a3b8", lineHeight: 18 },
  hint: { marginTop: 14, fontSize: 12, color: branding.colors.textSecondary, lineHeight: 18 },
  footer: { marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 18 },
});
