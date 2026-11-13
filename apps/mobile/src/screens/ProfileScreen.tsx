import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useProAccess } from "../hooks/useProAccess";
import ProBadge from "../components/ProBadge";
import i18n from "../i18n";
import { TELEGRAM_CHANNEL } from "../config/telegram";
import { openTelegramChannel } from "../config/community";
import { CONTENT_ERROR_REPORT } from "../config/contentErrorReport";
import { openContentErrorReport } from "../lib/brand/openContentErrorReport";
import { isOpenAccessPilot, STORE_SUPPORT_MAILTO } from "../config/storeRelease";
import { revokeAllSessions } from "../lib/auth/sessionApi";
import { wipeMobileClinicalLocalData } from "../lib/security/wipeClinicalLocal";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import { resolveBirthDateIso } from "@repo/types";

import { BirthDateDisplay } from "../components/BirthDateField";
import { DoctorRoleSettings } from "../components/clinical/DoctorRoleSettings";
import { MessageNotificationsSettings } from "../components/clinical/MessageNotificationsSettings";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ProfileTab">,
  NativeStackScreenProps<RootStackParamList>
>;

function nextLevelPoints(level: number) {
  if (level >= 5) return null;
  if (level === 4) return 600;
  if (level === 3) return 300;
  if (level === 2) return 150;
  return 50;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, loading, stars } = useCurrentUser();
  const { isPro } = useProAccess();
  const [supabaseLoggedIn, setSupabaseLoggedIn] = useState(false);
  const [birthDateIso, setBirthDateIso] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const openPilot = isOpenAccessPilot();

  const nextPoints = nextLevelPoints(user?.level ?? 1);
  const progress = nextPoints
    ? Math.min(100, Math.round(((user?.points ?? 0) / nextPoints) * 100))
    : 100;

  useEffect(() => {
    void supabaseMobile?.auth.getSession().then(({ data }) => {
      setSupabaseLoggedIn(Boolean(data.session));
      const meta = data.session?.user?.user_metadata;
      const iso = resolveBirthDateIso(
        typeof meta?.birth_date === "string" ? meta.birth_date : null,
      );
      setBirthDateIso(iso);
      const yearRaw = meta?.birth_year;
      setBirthYear(typeof yearRaw === "number" ? yearRaw : iso ? Number.parseInt(iso.slice(0, 4), 10) : null);
    });
  }, []);

  async function onRevokeAllDevices() {
    Alert.alert(
      "Выйти на всех устройствах?",
      "Сбросит вход на всех телефонах и в браузере. Используйте, если потеряли устройство.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Выйти везде",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!supabaseMobile) return;
              setRevokingSessions(true);
              try {
                const { data } = await supabaseMobile.auth.getSession();
                const token = data.session?.access_token;
                if (!token) {
                  Alert.alert("Сессия", "Нет активного входа Supabase.");
                  return;
                }
                const result = await revokeAllSessions(token);
                if (!result.ok) {
                  Alert.alert("Ошибка", result.error);
                  return;
                }
                await wipeMobileClinicalLocalData();
                await supabaseMobile.auth.signOut();
                setSupabaseLoggedIn(false);
                Alert.alert("Готово", "Выход на всех устройствах выполнен.");
              } finally {
                setRevokingSessions(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function onSignOutLocal() {
    if (!supabaseMobile) return;
    try {
      await wipeMobileClinicalLocalData();
      await supabaseMobile.auth.signOut();
      setSupabaseLoggedIn(false);
      Alert.alert("Готово", "Вы вышли из аккаунта на этом устройстве.");
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось выйти.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerKicker}>Аккаунт</Text>
        <Text style={styles.title}>{i18n.t("profile")}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={[styles.card, isPro && styles.cardPro]}>
        {loading ? <ActivityIndicator color="#0ea5a4" /> : null}
        <Text style={styles.name}>{user?.name ?? i18n.t("doctor")}</Text>
        {supabaseLoggedIn && (birthDateIso || birthYear) ? (
          <BirthDateDisplay iso={birthDateIso} birthYear={birthYear} />
        ) : null}
        <ProBadge isPro={isPro} />
        <Text style={styles.level}>{i18n.t("profile_level", { level: user?.level ?? 1 })}</Text>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={styles.points}>{i18n.t("points_label", { points: user?.points ?? 0 })}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {nextPoints
            ? i18n.t("until_next_level", { points: Math.max(0, nextPoints - (user?.points ?? 0)) })
            : i18n.t("max_level_reached")}
        </Text>

        <Pressable
          style={styles.langBtn}
          onPress={() => navigation.navigate("Language")}
        >
          <Text style={styles.langBtnText}>{i18n.t("language")}</Text>
        </Pressable>

        <DoctorRoleSettings />

        {supabaseLoggedIn ? <MessageNotificationsSettings /> : null}

        {supabaseLoggedIn ? (
          <View style={styles.securityBox}>
            <Text style={styles.securityTitle}>Безопасность входа</Text>
            <Text style={styles.securityHint}>
              Выход на этом устройстве или сброс сессий везде. Удаление аккаунта и данных — на{" "}
              Sonogyn-pro@mail.ru.
            </Text>
            <Pressable style={styles.securityBtn} onPress={() => void onSignOutLocal()}>
              <Text style={styles.securityBtnText}>Выйти</Text>
            </Pressable>
            <Pressable
              style={[styles.securityBtn, styles.securityBtnSecondary, revokingSessions && styles.securityBtnDisabled]}
              disabled={revokingSessions}
              onPress={onRevokeAllDevices}
            >
              <Text style={styles.securityBtnTextSecondary}>
                {revokingSessions ? "Выход…" : "Выйти на всех устройствах"}
              </Text>
            </Pressable>
          </View>
        ) : openPilot ? (
          <Text style={styles.securityHint}>
            Пилот App Store: вход не обязателен. Калькуляторы доступны сразу после согласия.
          </Text>
        ) : null}

        <Text style={styles.legalHeader}>{i18n.t("profile_legal_header")}</Text>
        <Pressable style={styles.legalRow} onPress={() => navigation.navigate("TermsOfUse")}>
          <Text style={styles.legalRowText}>{i18n.t("profile_legal_terms")}</Text>
          <Text style={styles.legalChev}>›</Text>
        </Pressable>
        <Pressable style={styles.legalRow} onPress={() => navigation.navigate("PrivacyPolicy")}>
          <Text style={styles.legalRowText}>{i18n.t("profile_legal_privacy")}</Text>
          <Text style={styles.legalChev}>›</Text>
        </Pressable>
        <Pressable style={styles.legalRow} onPress={() => navigation.navigate("MedicalDisclaimer")}>
          <Text style={styles.legalRowText}>{i18n.t("profile_legal_disclaimer")}</Text>
          <Text style={styles.legalChev}>›</Text>
        </Pressable>

        <Pressable
          style={styles.telegramRow}
          onPress={() => void openTelegramChannel()}
          accessibilityHint="При блокировке t.me в РФ нужен VPN или приложение Telegram"
        >
          <Text style={styles.telegramTitle}>{TELEGRAM_CHANNEL.name}</Text>
          <Text style={styles.telegramSub}>
            {TELEGRAM_CHANNEL.handle} · в РФ без VPN может не открыться
          </Text>
        </Pressable>

        <Pressable
          style={styles.telegramRow}
          onPress={() => void openContentErrorReport({ pageHint: "Profile" })}
          accessibilityRole="button"
          accessibilityLabel={`${CONTENT_ERROR_REPORT.labelRu}. ${CONTENT_ERROR_REPORT.ctaRu}`}
          accessibilityHint="Откроет Telegram @Yakrav7700 без данных пациентов"
        >
          <Text style={styles.telegramTitle}>{CONTENT_ERROR_REPORT.labelRu}</Text>
          <Text style={styles.telegramSub}>
            {CONTENT_ERROR_REPORT.ctaRu} · {CONTENT_ERROR_REPORT.handle}
          </Text>
        </Pressable>

        <Pressable
          style={styles.trialBtn}
          onPress={() => void Linking.openURL(STORE_SUPPORT_MAILTO)}
          accessibilityRole="link"
          accessibilityLabel="Написать в поддержку"
        >
          <Text style={styles.trialBtnText}>Поддержка · Sonogyn-pro@mail.ru</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  header: { marginBottom: 16 },
  headerKicker: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#0f172a" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 8,
  },
  cardPro: {
    borderColor: "#f5d487",
    backgroundColor: "#fffdf5",
  },
  name: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  level: { fontSize: 16, color: "#0f766e", fontWeight: "700" },
  stars: { fontSize: 24 },
  points: { fontSize: 15, color: "#334155" },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#0ea5a4" },
  progressText: { fontSize: 12, color: "#64748b" },
  langBtn: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  langBtnText: { color: "#0f172a", fontWeight: "600" },
  securityBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    padding: 12,
    gap: 6,
  },
  securityTitle: { color: "#92400e", fontWeight: "800", fontSize: 13 },
  securityHint: { color: "#78350f", fontSize: 12, lineHeight: 17, marginBottom: 8 },
  securityBtn: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f59e0b",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 10,
  },
  securityBtnDisabled: { opacity: 0.6 },
  securityBtnSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  securityBtnText: { color: "#92400e", fontWeight: "700", fontSize: 13 },
  securityBtnTextSecondary: { color: "#92400e", fontWeight: "700", fontSize: 13 },
  legalHeader: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  legalRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  legalRowText: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  legalChev: { fontSize: 18, color: "#cbd5e1", fontWeight: "300" },
  telegramRow: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7dd3fc",
    backgroundColor: "#e0f2fe",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  telegramTitle: { fontSize: 15, fontWeight: "700", color: "#0369a1" },
  telegramSub: { fontSize: 12, color: "#0284c7", marginTop: 4 },
  trialBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    padding: 10,
    gap: 6,
  },
  trialTitle: { color: "#1d4ed8", fontWeight: "800", fontSize: 13 },
  trialHint: { color: "#475569", fontSize: 12 },
  trialInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  trialActions: { flexDirection: "row", gap: 8 },
  trialBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    paddingVertical: 9,
  },
  trialBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  trialResetBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1" },
  trialResetText: { color: "#334155", fontWeight: "700", fontSize: 12 },
  inviteBtn: { flex: 0, width: "100%", marginTop: 4 },
  codesList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 8,
    gap: 4,
    maxHeight: 160,
  },
  codeRow: { color: "#1e3a8a", fontSize: 12, fontWeight: "700" },
});
