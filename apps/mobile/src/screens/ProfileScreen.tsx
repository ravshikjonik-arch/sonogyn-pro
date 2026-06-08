import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Linking,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useProAccess } from "../hooks/useProAccess";
import ProBadge from "../components/ProBadge";
import i18n from "../i18n";
import { activateTrialCode, clearTrialAccess, getTrialStatus } from "../services/trialAccess";
import { createOneTimeTrialCodes } from "../services/trialCodeAdmin";
import { TELEGRAM_CHANNEL } from "../config/telegram";
import { openTelegramChannel } from "../config/community";
import { buildGrTeamInviteMessage } from "../utils/grInviteText";

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
  const { isPro, source, refresh } = useProAccess();
  const [trialCode, setTrialCode] = useState("");
  const [trialInfo, setTrialInfo] = useState<string>("Trial не активирован");
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [codesCount, setCodesCount] = useState("10");
  const [codesDays, setCodesDays] = useState("14");

  const nextPoints = nextLevelPoints(user?.level ?? 1);
  const progress = nextPoints
    ? Math.min(100, Math.round(((user?.points ?? 0) / nextPoints) * 100))
    : 100;

  useEffect(() => {
    void getTrialStatus().then((s) => {
      if (!s.active) {
        setTrialInfo("Trial не активирован");
        return;
      }
      setTrialInfo(`Trial активен: ${s.daysLeft} дн. (код ${s.code ?? "—"})`);
    });
  }, []);

  async function onActivateTrial() {
    try {
      const out = await activateTrialCode(trialCode);
      setTrialInfo(`Trial активен: ${out.daysLeft} дн. (код ${out.code ?? "—"})`);
      setTrialCode("");
      await refresh();
      Alert.alert("Готово", "Пробный доступ активирован.");
    } catch (e) {
      Alert.alert("Trial код", e instanceof Error ? e.message : "Не удалось активировать код.");
    }
  }

  async function onCopyGrInvite() {
    try {
      await Clipboard.setStringAsync(buildGrTeamInviteMessage());
      Alert.alert("Готово", "Инструкция для GR скопирована в буфер.");
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось скопировать.");
    }
  }

  async function onShareGrInvite() {
    const message = buildGrTeamInviteMessage();
    try {
      await Share.share({ message });
    } catch {
      /* user cancelled */
    }
  }

  async function onGenerateCodes() {
    try {
      const count = Math.max(1, Number(codesCount) || 10);
      const days = Math.max(1, Number(codesDays) || 14);
      const codes = await createOneTimeTrialCodes({ count, days, prefix: "DOC" });
      setNewCodes(codes);
      await Clipboard.setStringAsync(codes.join("\n"));
      Alert.alert("Готово", `Сгенерировано ${codes.length} кодов. Скопированы в буфер.`);
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось создать коды.");
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

        <View style={styles.trialBox}>
          <Text style={styles.trialTitle}>Пробная версия для коллег</Text>
          <Text style={styles.trialHint}>
            Статус: {isPro ? (source === "trial" ? "TRIAL ACTIVE" : "PRO ACTIVE") : "FREE"}
          </Text>
          <Text style={styles.trialHint}>{trialInfo}</Text>
          <TextInput
            style={styles.trialInput}
            value={trialCode}
            onChangeText={setTrialCode}
            placeholder="Введите trial-код"
            autoCapitalize="characters"
          />
          <View style={styles.trialActions}>
            <Pressable style={styles.trialBtn} onPress={onActivateTrial}>
              <Text style={styles.trialBtnText}>Активировать код</Text>
            </Pressable>
            <Pressable
              style={[styles.trialBtn, styles.trialResetBtn]}
              onPress={async () => {
                await clearTrialAccess();
                setTrialInfo("Trial не активирован");
                await refresh();
              }}
            >
              <Text style={styles.trialResetText}>Сброс trial</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.trialBox}>
          <Text style={styles.trialTitle}>Пригласить коллег (GR)</Text>
          <Text style={styles.trialHint}>
            Текст с шагами: Expo Go, у вас — npm run start:share (туннель), у коллег — QR или ссылка,
            затем trial-код из блока выше.
          </Text>
          <Pressable style={[styles.trialBtn, styles.inviteBtn]} onPress={onCopyGrInvite}>
            <Text style={styles.trialBtnText}>Скопировать инструкцию</Text>
          </Pressable>
          <Pressable style={[styles.trialBtn, styles.trialResetBtn, styles.inviteBtn]} onPress={onShareGrInvite}>
            <Text style={styles.trialResetText}>Поделиться…</Text>
          </Pressable>
        </View>

        <View style={styles.trialBox}>
          <Text style={styles.trialTitle}>Админ: генерация кодов для коллег</Text>
          <View style={styles.trialActions}>
            <TextInput
              style={[styles.trialInput, { flex: 1 }]}
              value={codesCount}
              onChangeText={setCodesCount}
              keyboardType="numeric"
              placeholder="Кол-во"
            />
            <TextInput
              style={[styles.trialInput, { flex: 1 }]}
              value={codesDays}
              onChangeText={setCodesDays}
              keyboardType="numeric"
              placeholder="Дней"
            />
          </View>
          <Pressable style={styles.trialBtn} onPress={onGenerateCodes}>
            <Text style={styles.trialBtnText}>Сгенерировать одноразовые коды</Text>
          </Pressable>
          {newCodes.length ? (
            <View style={styles.codesList}>
              {newCodes.map((c) => (
                <Text key={c} style={styles.codeRow}>
                  {c}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
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
