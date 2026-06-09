import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CLINICAL_3D_LOCALES, DEFAULT_CLINICAL_3D_LOCALE, type Clinical3dLocale } from "@repo/clinical-3d";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import {
  apiTelegramAuthPoll,
  apiTelegramAuthStart,
  apiTelegramSupabaseSession,
  getWebApiBase,
} from "../api/chatBackend";
import { useOAuthSignIn } from "../hooks/useOAuthSignIn";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { changeLanguage, isAppLanguage, type AppLanguage } from "../i18n";
import { signInViaApi, signUpViaApi } from "../lib/auth/emailAuthApi";
import { isTurnstileConfiguredOnMobile, obtainTurnstileToken } from "../lib/auth/turnstileMobile";
import { markSessionAnchorNow } from "../lib/security/sessionAnchor";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import type { RootStackParamList } from "../navigation/paramLists";
import { useAppGate } from "../navigation/AppGateContext";

type Props = NativeStackScreenProps<RootStackParamList, "SupabaseAuth">;
type Tab = "email" | "phone" | "social";

WebBrowser.maybeCompleteAuthSession();

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Неверные учётные данные.";
  if (/user already registered/i.test(message)) return "Если аккаунт можно создать, вы получите письмо с инструкциями.";
  if (/network request failed|failed to fetch/i.test(message)) return "Нет сети. Требуется интернет для входа.";
  if (/captcha|turnstile/i.test(message)) return "Подтвердите, что вы не робот (CAPTCHA).";
  if (/too many attempts|rate/i.test(message)) return "Слишком много попыток. Подождите и попробуйте снова.";
  return "Неверные учётные данные.";
}

type AuthLocale = Clinical3dLocale | "es";

export default function SupabaseAuthScreen({ navigation }: Props) {
  const { refreshSupabaseSession } = useAppGate();
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);
  const [locale, setLocale] = useState<AuthLocale>(DEFAULT_CLINICAL_3D_LOCALE);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [captchaBusy, setCaptchaBusy] = useState(false);

  const localeOptions = useMemo(
    (): Array<{ code: AuthLocale; label: string }> => [
      ...CLINICAL_3D_LOCALES.map((l) => ({ code: l.code as AuthLocale, label: l.label })),
      { code: "es", label: "Español" },
    ],
    [],
  );

  const phoneAuth = usePhoneAuth();
  const { signIn: signInOAuth } = useOAuthSignIn();

  const finishAuth = useCallback(async () => {
    await markSessionAnchorNow();
    await refreshSupabaseSession();
    navigation.navigate("Main");
  }, [navigation, refreshSupabaseSession]);

  async function runTurnstileChallenge() {
    if (!isTurnstileConfiguredOnMobile()) {
      Alert.alert("CAPTCHA", "Turnstile не настроен (EXPO_PUBLIC_TURNSTILE_SITE_KEY / API base).");
      return;
    }
    setCaptchaBusy(true);
    try {
      const token = await obtainTurnstileToken();
      if (!token) {
        Alert.alert("CAPTCHA", "Подтверждение отменено или не удалось.");
        return;
      }
      setTurnstileToken(token);
      setRequiresCaptcha(false);
    } finally {
      setCaptchaBusy(false);
    }
  }

  const completeTelegramNonce = useCallback(
    async (nonce: string) => {
      if (!supabaseMobile) return false;
      setOauthLoading("telegram");
      try {
        const session = await apiTelegramSupabaseSession(nonce);
        await supabaseMobile.auth.setSession(session);
        await finishAuth();
        return true;
      } catch (e) {
        Alert.alert("Telegram", e instanceof Error ? e.message : "Ошибка входа");
        return false;
      } finally {
        setOauthLoading(null);
      }
    },
    [finishAuth],
  );

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return;
      const parsed = Linking.parse(url);
      const nonceRaw = parsed.queryParams?.telegram_nonce;
      const nonce = typeof nonceRaw === "string" ? nonceRaw : Array.isArray(nonceRaw) ? nonceRaw[0] : null;
      if (nonce) {
        await completeTelegramNonce(nonce);
      }
    }

    void Linking.getInitialURL().then((url) => void handleUrl(url));
    const sub = Linking.addEventListener("url", (event) => void handleUrl(event.url));
    return () => sub.remove();
  }, [completeTelegramNonce]);

  async function submitEmail() {
    if (!supabaseMobile) {
      Alert.alert("Supabase", "Задайте EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setBusy(true);
    try {
      if (requiresCaptcha && !turnstileToken) {
        Alert.alert("CAPTCHA", "Подтвердите, что вы не робот, затем повторите вход.");
        return;
      }
      if (mode === "sign-up") {
        const result = await signUpViaApi(email.trim(), password, email.trim().split("@")[0] ?? "User", {
          preferred_locale: locale,
          turnstileToken,
        });
        if (!result.ok) {
          setRequiresCaptcha(Boolean(result.requiresCaptcha));
          if (result.requiresCaptcha) setTurnstileToken(undefined);
          Alert.alert("Ошибка", translateAuthError(result.error));
          return;
        }
        if (isAppLanguage(locale)) {
          await changeLanguage(locale as AppLanguage);
        }
        if (result.session) {
          await supabaseMobile.auth.setSession(result.session);
          await finishAuth();
          return;
        }
        Alert.alert(
          "Готово",
          "Если аккаунт можно создать, вы получите письмо с инструкциями.",
        );
      } else {
        const result = await signInViaApi(email.trim(), password, turnstileToken);
        if (!result.ok) {
          setRequiresCaptcha(Boolean(result.requiresCaptcha));
          if (result.requiresCaptcha) setTurnstileToken(undefined);
          Alert.alert("Ошибка", translateAuthError(result.error));
          return;
        }
        if (!result.session) {
          Alert.alert("Ошибка", "Неверные учётные данные.");
          return;
        }
        await supabaseMobile.auth.setSession(result.session);
        await finishAuth();
      }
    } catch (e) {
      Alert.alert("Ошибка", translateAuthError(e instanceof Error ? e.message : "Не удалось войти"));
    } finally {
      setBusy(false);
    }
  }

  async function submitPhone() {
    if (phoneAuth.otpSent) {
      const ok = await phoneAuth.verifyOtp();
      if (ok) await finishAuth();
      return;
    }
    await phoneAuth.sendOtp(mode === "sign-up");
  }

  async function onSocial(provider: AuthProvider) {
    if (provider === "telegram") {
      await signInTelegram();
      return;
    }

    setOauthLoading(provider);
    try {
      const result = await signInOAuth(provider);
      if (!result.ok) {
        Alert.alert("OAuth", result.error ?? "Авторизация отменена.");
        return;
      }
      await finishAuth();
    } finally {
      setOauthLoading(null);
    }
  }

  async function signInTelegram() {
    setOauthLoading("telegram");
    try {
      const webBase = getWebApiBase();
      if (webBase) {
        const redirectTo = Linking.createURL("auth/callback", {
          scheme: process.env.EXPO_PUBLIC_AUTH_REDIRECT_SCHEME || "com.yakrav7700.usriskcalc",
        });
        const bridgeUrl = `${webBase}/auth/telegram-bridge?redirect=${encodeURIComponent(redirectTo)}`;
        const result = await WebBrowser.openAuthSessionAsync(bridgeUrl, redirectTo);
        if (result.type === "success" && result.url) {
          const parsed = Linking.parse(result.url);
          const access = parsed.queryParams?.access_token;
          const refresh = parsed.queryParams?.refresh_token;
          if (
            typeof access === "string" &&
            typeof refresh === "string" &&
            supabaseMobile
          ) {
            await supabaseMobile.auth.setSession({ access_token: access, refresh_token: refresh });
            await finishAuth();
            return;
          }
        }
      }

      const start = await apiTelegramAuthStart();
      await Linking.openURL(start.botUrl);

      for (let i = 0; i < 30; i += 1) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await apiTelegramAuthPoll(start.nonce);
        if (poll.status === "ok") {
          const nonce = poll.nonce ?? start.nonce;
          const ok = await completeTelegramNonce(nonce);
          if (ok) return;
        }
        if (poll.status === "expired") break;
      }

      Alert.alert("Telegram", "Не удалось завершить вход. Попробуйте снова.");
    } catch (e) {
      Alert.alert("Telegram", e instanceof Error ? e.message : "Ошибка Telegram auth");
    } finally {
      setOauthLoading(null);
    }
  }

  const loading = busy || phoneAuth.busy || oauthLoading !== null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>SonoGyn Pro</Text>
      <Text style={styles.title}>Вход / регистрация</Text>
      <Text style={styles.body}>
        Email, телефон или соцсети. Регистрируясь, вы соглашаетесь с политикой конфиденциальности.
      </Text>

      <View style={styles.tabRow}>
        {([
          ["email", "Почта"],
          ["phone", "Телефон"],
          ["social", "Соцсети"],
        ] as const).map(([id, label]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`Вкладка ${label}`}
            style={[styles.tab, tab === id && styles.tabActive]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "email" ? (
        <View style={styles.panel}>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggle, mode === "sign-in" && styles.toggleActive]}
              onPress={() => setMode("sign-in")}
              accessibilityLabel="Режим входа"
            >
              <Text style={[styles.toggleText, mode === "sign-in" && styles.toggleTextActive]}>Войти</Text>
            </Pressable>
            <Pressable
              style={[styles.toggle, mode === "sign-up" && styles.toggleActive]}
              onPress={() => setMode("sign-up")}
              accessibilityLabel="Режим регистрации"
            >
              <Text style={[styles.toggleText, mode === "sign-up" && styles.toggleTextActive]}>Регистрация</Text>
            </Pressable>
          </View>
          {mode === "sign-up" ? (
            <View style={styles.localeBlock}>
              <Text style={styles.localeLabel}>Язык интерфейса</Text>
              <View style={styles.localeRow}>
                {localeOptions.map((opt) => (
                  <Pressable
                    key={opt.code}
                    style={[styles.localeChip, locale === opt.code && styles.localeChipActive]}
                    onPress={() => setLocale(opt.code)}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[styles.localeChipText, locale === opt.code && styles.localeChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            accessibilityLabel="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            secureTextEntry
            placeholder="Пароль"
            accessibilityLabel="Пароль"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          {requiresCaptcha ? (
            <View style={styles.captchaBlock}>
              <Text style={styles.captchaHint}>
                {turnstileToken ? "CAPTCHA пройдена." : "После нескольких ошибок нужна CAPTCHA."}
              </Text>
              {!turnstileToken ? (
                <Pressable
                  style={[styles.secondaryBtn, (loading || captchaBusy) && styles.primaryDisabled]}
                  disabled={loading || captchaBusy}
                  onPress={() => void runTurnstileChallenge()}
                  accessibilityLabel="Пройти CAPTCHA"
                >
                  {captchaBusy ? (
                    <ActivityIndicator color="#005CB9" />
                  ) : (
                    <Text style={styles.secondaryBtnText}>Подтвердить CAPTCHA</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Pressable
            style={[styles.primary, loading && styles.primaryDisabled]}
            disabled={loading}
            onPress={() => void submitEmail()}
            accessibilityLabel={mode === "sign-in" ? "Войти" : "Зарегистрироваться"}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === "sign-in" ? "Войти" : "Зарегистрация"}</Text>}
          </Pressable>
        </View>
      ) : null}

      {tab === "phone" ? (
        <View style={styles.panel}>
          <TextInput
            keyboardType="phone-pad"
            placeholder="+79001234567"
            accessibilityLabel="Номер телефона"
            style={styles.input}
            value={phoneAuth.phone}
            onChangeText={phoneAuth.setPhone}
          />
          {phoneAuth.otpSent ? (
            <TextInput
              keyboardType="number-pad"
              placeholder="Код из SMS"
              accessibilityLabel="Код из SMS"
              style={styles.input}
              value={phoneAuth.otp}
              onChangeText={phoneAuth.setOtp}
            />
          ) : null}
          {phoneAuth.error ? <Text style={styles.error}>{phoneAuth.error}</Text> : null}
          <Pressable
            style={[styles.primary, loading && styles.primaryDisabled]}
            disabled={loading}
            onPress={() => void submitPhone()}
            accessibilityLabel={phoneAuth.otpSent ? "Подтвердить код" : "Получить SMS"}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{phoneAuth.otpSent ? "Подтвердить" : "Получить SMS"}</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {tab === "social" ? (
        <View style={styles.panel}>
          <AuthButtons onProviderPress={(p) => void onSocial(p)} loading={oauthLoading} variant={mode === "sign-up" ? "register" : "login"} />
        </View>
      ) : null}

      <Pressable style={styles.secondary} onPress={() => navigation.goBack()} accessibilityLabel="Назад">
        <Text style={styles.secondaryText}>Назад</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 14, backgroundColor: "#F8FBFF", flexGrow: 1 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase", color: "#0EA5E9" },
  title: { fontSize: 26, fontWeight: "900", color: "#0F172A" },
  body: { fontSize: 14, lineHeight: 21, color: "#475569" },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabActive: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  tabText: { fontWeight: "800", color: "#64748B", fontSize: 12 },
  tabTextActive: { color: "#075985" },
  panel: { gap: 12, marginTop: 4 },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggle: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleActive: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  toggleText: { fontWeight: "800", color: "#64748B" },
  toggleTextActive: { color: "#075985" },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  primary: {
    borderRadius: 999,
    backgroundColor: "#005CB9",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#005CB9",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#005CB9", fontWeight: "800", fontSize: 14 },
  captchaBlock: { gap: 8 },
  captchaHint: { fontSize: 13, color: "#475569", fontWeight: "600" },
  secondary: { paddingVertical: 8, alignItems: "center" },
  secondaryText: { color: "#005CB9", fontWeight: "800" },
  error: { color: "#B91C1C", fontSize: 13, fontWeight: "600" },
  localeBlock: { gap: 8 },
  localeLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  localeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  localeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  localeChipActive: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  localeChipText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  localeChipTextActive: { color: "#075985" },
});
