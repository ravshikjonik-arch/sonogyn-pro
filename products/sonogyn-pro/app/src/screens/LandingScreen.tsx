import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { communityLinks } from "../config/community";
import { PRODUCT } from "../config/product";
import { useAppGate } from "../navigation/AppGateContext";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "Landing">;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const PRODUCT_NAME = PRODUCT.fullName;
const PRODUCT_TAGLINE = PRODUCT.taglineRu;
const CONTACT = "+7 993 300-00-70";

function openExternal(url: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const features = [
  {
    title: "AI analysis",
    ru: "AI-поддержка описания",
    text: "Structured ultrasound context for draft reports and clinical reasoning.",
  },
  {
    title: "Auto reports",
    ru: "Авто-протоколы",
    text: "Clean report blocks for O-RADS, BI-RADS, FIGO, IOTA and daily OB/GYN workflows.",
  },
  {
    title: "Clinical calculators",
    ru: "Клинические калькуляторы",
    text: "O-RADS • BI-RADS • TI-RADS • FIGO • FMF • POP-Q in one web interface.",
  },
  {
    title: "Case discussions",
    ru: "Кейсы и обсуждения",
    text: "Store ultrasound cases, images, comments and decision trails in a shared workspace.",
  },
];

const screenshots = [
  {
    title: "O-RADS + IOTA",
    subtitle: "Adnexal risk, visual atlas and export-ready report",
    accent: "#0EA5E9",
    rows: ["Risk category", "IOTA 2026 variables", "Clinical protocol"],
  },
  {
    title: "AI report",
    subtitle: "Draft ultrasound report support for doctors",
    accent: "#2563EB",
    rows: ["Findings summary", "Structured impression", "Doctor-controlled output"],
  },
  {
    title: "Cases",
    subtitle: "Images, comments and clinical history",
    accent: "#0F766E",
    rows: ["Patient case", "Ultrasound photo", "Discussion thread"],
  },
];

export default function LandingScreen({ navigation }: Props) {
  const { consentOk } = useAppGate();
  const { width } = useWindowDimensions();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const isCompact = width < 760;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const appTarget = useMemo(() => (consentOk ? "Main" : "Consent"), [consentOk]);

  async function onInstall() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    navigation.navigate(appTarget);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Text style={styles.logo}>{PRODUCT_NAME}</Text>
          <View style={styles.navLinks}>
            <Text style={styles.navLink}>Features</Text>
            <Text style={styles.navLink}>Community</Text>
            <Text style={styles.navLink}>Contact</Text>
          </View>
        </View>

        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Pilot medical ultrasound platform</Text>
            <Text style={styles.title}>{PRODUCT_NAME}</Text>
            <Text style={styles.subtitle}>{PRODUCT.shortName} · O-RADS • BI-RADS • кейсы • протоколы</Text>
            <Text style={styles.subtitleRu}>{PRODUCT_TAGLINE}. Международная web/PWA-платформа для врачей УЗД.
            </Text>
            <View style={styles.ctaRow}>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate(appTarget)}>
                <Text style={styles.primaryText}>Open Web App</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={onInstall}>
                <Text style={styles.secondaryText}>{installPrompt ? "Install PWA" : "Use as iPhone app"}</Text>
              </Pressable>
            </View>
            <Pressable style={styles.pilotLink} onPress={() => navigation.navigate("SupabaseAuth")}>
              <Text style={styles.pilotLinkText}>Supabase platform login (education workspace)</Text>
            </Pressable>
            <Text style={styles.installHint}>RU/EN interface · beta pilot · clinical decision support, not a diagnosis.</Text>
            {Platform.OS === "web" && (
              <Pressable
                style={styles.pilotLink}
                onPress={() =>
                  navigation.navigate("GynecologyCalc", {
                    initialPage: "gyn_uterus_clinic",
                  })
                }
              >
                <Text style={styles.pilotLinkText}>
                  Сразу открыть модуль «Матка FIGO + 3D» (образование, без домашнего меню)
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.productMock}>
            <View style={styles.mockTopBar}>
              <View style={styles.mockDot} />
              <View style={styles.mockDot} />
              <View style={styles.mockDot} />
            </View>
            <View style={styles.mockHeroRow}>
              <View>
                <Text style={styles.mockEyebrow}>Clinical workspace</Text>
                <Text style={styles.mockMainTitle}>O-RADS + IOTA</Text>
              </View>
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>PWA</Text>
              </View>
            </View>
            {screenshots.map((card) => (
              <View key={card.title} style={styles.mockCard}>
                <View style={[styles.mockIcon, { backgroundColor: card.accent }]} />
                <View style={styles.mockText}>
                  <Text style={styles.mockTitle}>{card.title}</Text>
                  <Text style={styles.mockSubtitle}>{card.subtitle}</Text>
                  <View style={styles.mockRows}>
                    {card.rows.map((row) => (
                      <View key={row} style={styles.mockRow}>
                        <View style={[styles.mockRowDot, { backgroundColor: card.accent }]} />
                        <Text style={styles.mockRowText}>{row}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Features / Возможности</Text>
          <Text style={styles.sectionTitle}>Built for daily ultrasound workflow</Text>
          <View style={styles.featureGrid}>
            {features.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureRu}>{feature.ru}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.screenshotSection]}>
          <Text style={styles.sectionKicker}>Screenshots / Product preview</Text>
          <Text style={styles.sectionTitle}>Hybrid clinical UI previews</Text>
          <View style={styles.previewGrid}>
            {screenshots.map((shot) => (
              <View key={shot.title} style={styles.previewCard}>
                <View style={[styles.previewHeader, { backgroundColor: shot.accent }]}>
                  <Text style={styles.previewHeaderText}>{shot.title}</Text>
                </View>
                <Text style={styles.previewSub}>{shot.subtitle}</Text>
                {shot.rows.map((row) => (
                  <View key={row} style={styles.previewLine}>
                    <View style={[styles.previewBullet, { backgroundColor: shot.accent }]} />
                    <Text style={styles.previewLineText}>{row}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.community}>
          <Text style={styles.communityKicker}>Community</Text>
          <Text style={styles.communityTitle}>Ultrasound community for doctors</Text>
          <Text style={styles.communityText}>
            A pilot workspace for ultrasound doctors: discuss clinical cases, standardize reports,
            and grow a shared language for OB/GYN, breast, thyroid and adnexal ultrasound.
          </Text>
          <Text style={styles.communityTextRu}>
            Сообщество врачей УЗД для кейсов, протоколов, классификаций и ежедневной клинической практики.
          </Text>
          <Pressable style={styles.telegramBtn} onPress={() => openExternal(communityLinks.telegramChannelUrl)}>
            <Text style={styles.telegramBtnText}>Join Telegram Channel</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerBrand}>{PRODUCT_NAME}</Text>
            <Text style={styles.footerText}>Premium medical SaaS pilot for ultrasound doctors.</Text>
          </View>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => navigation.navigate("PrivacyPolicy")}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate("TermsOfUse")}>
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
            <Pressable onPress={() => openExternal(communityLinks.telegramChannelUrl)}>
              <Text style={styles.footerLink}>Telegram Channel</Text>
            </Pressable>
            <Text style={styles.footerLink}>Telegram / Contact: {CONTACT}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FBFF" },
  scroll: { padding: 20, paddingBottom: 36, gap: 28 },
  nav: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1160,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  logo: { color: "#0F172A", fontSize: 16, fontWeight: "900" },
  navLinks: { flexDirection: "row", gap: 18 },
  navLink: { color: "#64748B", fontSize: 13, fontWeight: "800" },
  hero: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1160,
    minHeight: 620,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 34,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 22 },
    shadowRadius: 44,
    elevation: 8,
  },
  heroCompact: { flexDirection: "column", alignItems: "stretch", minHeight: 0, padding: 22 },
  heroCopy: { flex: 1, gap: 16 },
  kicker: { color: "#0EA5E9", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: "#08111F", fontSize: 58, lineHeight: 62, fontWeight: "900", letterSpacing: -2.2, maxWidth: 640 },
  subtitle: { color: "#0F4C81", fontSize: 20, lineHeight: 30, fontWeight: "800", maxWidth: 620 },
  subtitleRu: { color: "#475569", fontSize: 17, lineHeight: 27, maxWidth: 620 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  primaryBtn: { backgroundColor: "#005CB9", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 15 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  secondaryText: { color: "#005CB9", fontSize: 16, fontWeight: "800" },
  installHint: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  pilotLink: { alignSelf: "flex-start", marginTop: 6, paddingVertical: 4 },
  pilotLinkText: { color: "#005CB9", fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  productMock: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    borderRadius: 30,
    backgroundColor: "#08111F",
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 28 },
    shadowRadius: 38,
    elevation: 12,
  },
  mockTopBar: { flexDirection: "row", gap: 6, paddingHorizontal: 4, paddingTop: 2 },
  mockDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#334155" },
  mockHeroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 6 },
  mockEyebrow: { color: "#93C5FD", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  mockMainTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 3 },
  mockBadge: { backgroundColor: "#DBEAFE", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  mockBadgeText: { color: "#1D4ED8", fontSize: 11, fontWeight: "900" },
  mockCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: "#fff", borderRadius: 20, padding: 14 },
  mockIcon: { width: 48, height: 48, borderRadius: 16 },
  mockText: { flex: 1 },
  mockTitle: { color: "#0F172A", fontSize: 16, fontWeight: "900" },
  mockSubtitle: { color: "#64748B", fontSize: 13, marginTop: 3 },
  mockRows: { gap: 5, marginTop: 10 },
  mockRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  mockRowDot: { width: 6, height: 6, borderRadius: 3 },
  mockRowText: { color: "#475569", fontSize: 11, fontWeight: "700" },
  section: { alignSelf: "center", width: "100%", maxWidth: 1160 },
  sectionKicker: { color: "#0EA5E9", fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  sectionTitle: { color: "#0F172A", fontSize: 32, fontWeight: "900", marginBottom: 16, letterSpacing: -0.8 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: {
    flexGrow: 1,
    flexBasis: 250,
    gap: 6,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  featureTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" },
  featureRu: { color: "#005CB9", fontSize: 13, fontWeight: "900" },
  featureText: { color: "#475569", fontSize: 14, lineHeight: 21, fontWeight: "600", marginTop: 4 },
  screenshotSection: { marginTop: 4 },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  previewCard: {
    flexGrow: 1,
    flexBasis: 300,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  previewHeader: { borderRadius: 18, padding: 18, minHeight: 96, justifyContent: "flex-end" },
  previewHeaderText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  previewSub: { color: "#475569", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  previewLine: { flexDirection: "row", gap: 8, alignItems: "center" },
  previewBullet: { width: 8, height: 8, borderRadius: 4 },
  previewLineText: { color: "#0F172A", fontSize: 13, fontWeight: "800" },
  community: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1160,
    borderRadius: 32,
    backgroundColor: "#005CB9",
    padding: 28,
    gap: 8,
  },
  communityKicker: { color: "#BAE6FD", fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  communityTitle: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  communityText: { color: "#DBEAFE", fontSize: 16, lineHeight: 25, maxWidth: 780, fontWeight: "700" },
  communityTextRu: { color: "#EFF6FF", fontSize: 14, lineHeight: 22, maxWidth: 780, fontWeight: "600" },
  telegramBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  telegramBtnText: { color: "#005CB9", fontSize: 15, fontWeight: "900" },
  footer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1160,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 22,
  },
  footerBrand: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  footerText: { color: "#64748B", fontSize: 12, lineHeight: 18, marginTop: 4 },
  footerLinks: { gap: 7, alignItems: "flex-end" },
  footerLink: { color: "#005CB9", fontSize: 13, fontWeight: "800" },
});
