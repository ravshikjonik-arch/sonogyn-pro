import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
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
import { DOCTOR_SPECIALIZATION_OPTIONS } from "@repo/clinical-tools";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons, RU_AUTH_PROVIDERS } from "@repo/ui";
import {
  birthDateErrorMessage,
  validateBirthDateIso,
} from "@repo/types";

import { BirthDateField } from "../components/BirthDateField";
import { useOAuthSignIn } from "../hooks/useOAuthSignIn";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { useTelegramAuth } from "../hooks/useTelegramAuth";
import { changeLanguage, isAppLanguage, type AppLanguage } from "../i18n";
import { signInViaApi, signUpViaApi, verifyMfaViaApi } from "../lib/auth/emailAuthApi";
import { isTurnstileConfiguredOnMobile, obtainTurnstileToken } from "../lib/auth/turnstileMobile";
import { markSessionAnchorNow } from "../lib/security/sessionAnchor";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import type { RootStackParamList } from "../navigation/paramLists";
import { useAppGate } from "../navigation/AppGateContext";

type Props = NativeStackScreenProps<RootStackParamList, "SupabaseAuth">;
type Tab = "telegram" | "email" | "phone" | "social";

const TELEGRAM_BOT_NAME =
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "SonogynProBot";

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
  const [tab, setTab] = useState<Tab>("phone");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDateIso, setBirthDateIso] = useState("");
  const [specialization, setSpecialization] = useState("Акушер-гинеколог");
  const [busy, setBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);
  const [locale, setLocale] = useState<AuthLocale>(DEFAULT_CLINICAL_3D_LOCALE);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [captchaBusy, setCaptchaBusy] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaPendingSession, setMfaPendingSession] = useState<
    { access_token: string; refresh_token: string } | undefined
  >();

  const localeOptions = useMemo(
    (): Array<{ code: AuthLocale; label: string }> => [
      ...CLINICAL_3D_LOCALES.map((l) => ({ code: l.code as AuthLocale, label: l.label })),
      { code: "es", label: "Español" },
    ],
    [],
  );

  const phoneAuth = usePhoneAuth();
  const telegramAuth = useTelegramAuth();
  const { signIn: signInOAuth } = useOAuthSignIn();

  function validateSignUpDoctorFields(): { birth_date: string; birth_year: number } | null {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert("Регистрация", "Укажите ФИО врача.");
      return null;
    }
    if (!birthDateIso.trim() || validateBirthDateIso(birthDateIso)) {
      Alert.alert(
        "Регистрация",
        birthDateErrorMessage(validateBirthDateIso(birthDateIso) ?? "empty"),
      );
      return null;
    }
    if (!specialization.trim()) {
      Alert.alert("Регистрация", "Выберите специализацию.");
      return null;
    }
    return {
      birth_date: birthDateIso,
      birth_year: Number.parseInt(birthDateIso.slice(0, 4), 10),
    };
  }

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

  async function submitMfa() {
    if (!supabaseMobile || !mfaFactorId) return;
    setBusy(true);
    try {
      const result = await verifyMfaViaApi(mfaFactorId, mfaCode.trim(), mfaPendingSession);
      if (!result.ok) {
        Alert.alert("MFA", translateAuthError(result.error));
        return;
      }
      if (!result.session) {
        Alert.alert("MFA", "Неверный или просроченный код.");
        return;
      }
      await supabaseMobile.auth.setSession(result.session);
      setMfaRequired(false);
      await finishAuth();
    } finally {
      setBusy(false);
    }
  }

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
        const birth = validateSignUpDoctorFields();
        if (!birth) return;
        const result = await signUpViaApi(email.trim(), password, fullName.trim(), {
          preferred_locale: locale,
          turnstileToken,
          birth_date: birth.birth_date,
          birth_year: birth.birth_year,
          specialization: specialization.trim(),
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
        if (result.needsMfa && result.factorId) {
          setMfaRequired(true);
          setMfaFactorId(result.factorId);
          setMfaPendingSession(result.session);
          Alert.alert("MFA", "Введите код из приложения аутентификатора.");
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

  async function submitTelegram() {
    if (telegramAuth.otpSent) {
      const registration =
        mode === "sign-up"
          ? (() => {
              const birth = validateSignUpDoctorFields();
              if (!birth) return null;
              return {
                full_name: fullName.trim(),
                birth_date: birth.birth_date,
                birth_year: birth.birth_year,
                specialization: specialization.trim(),
                preferred_locale: locale,
              };
            })()
          : undefined;
      if (mode === "sign-up" && !registration) return;
      const ok = await telegramAuth.verifyOtp(registration ?? undefined, mode === "sign-up");
      if (ok) await finishAuth();
      return;
    }
    await telegramAuth.sendOtp(mode === "sign-up");
  }

  async function submitPhone() {
    if (phoneAuth.otpSent) {
      const registration =
        mode === "sign-up"
          ? (() => {
              const birth = validateSignUpDoctorFields();
              if (!birth) return null;
              return {
                full_name: fullName.trim(),
                birth_date: birth.birth_date,
                birth_year: birth.birth_year,
                specialization: specialization.trim(),
                preferred_locale: locale,
              };
            })()
          : undefined;
      if (mode === "sign-up" && !registration) return;
      const ok = await phoneAuth.verifyOtp(registration ?? undefined, mode === "sign-up");
      if (ok) await finishAuth();
      return;
    }
    await phoneAuth.sendOtp(mode === "sign-up");
  }

  async function onSocial(provider: Exclude<AuthProvider, "telegram">) {
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

  const loading = busy || phoneAuth.busy || telegramAuth.busy || oauthLoading !== null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>SonoGyn Pro</Text>
      <Text style={styles.title}>Вход / регистрация</Text>
      <Text style={styles.body}>
        SMS (+7), Яндекс ID, Telegram или email — способы входа для пилота.
      </Text>

      <View style={styles.tabRow}>
        {([
          ["phone", "SMS"],
          ["social", "Яндекс ID"],
          ["telegram", "Telegram"],
          ["email", "Почта"],
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

      {mode === "sign-up" && (tab === "email" || tab === "phone" || tab === "telegram") ? (
        <View style={styles.panel}>
          <TextInput
            placeholder="ФИО врача"
            accessibilityLabel="ФИО врача"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
          <BirthDateField value={birthDateIso} onChange={setBirthDateIso} />
          <View style={styles.specBlock}>
            <Text style={styles.specLabel}>Специализация</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specScroll}>
              {DOCTOR_SPECIALIZATION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.specChip, specialization === opt && styles.specChipActive]}
                  onPress={() => setSpecialization(opt)}
                >
                  <Text style={[styles.specChipText, specialization === opt && styles.specChipTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {tab === "telegram" ? (
        <View style={styles.panel}>
          <TextInput
            keyboardType="number-pad"
            placeholder="Telegram ID"
            accessibilityLabel="Telegram ID"
            style={styles.input}
            value={telegramAuth.chatId}
            onChangeText={telegramAuth.setChatId}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email для резерва"
            accessibilityLabel="Email для резервной отправки"
            style={styles.input}
            value={telegramAuth.fallbackEmail}
            onChangeText={telegramAuth.setFallbackEmail}
          />
          {telegramAuth.otpSent ? (
            <TextInput
              keyboardType="number-pad"
              placeholder="Код из Telegram"
              accessibilityLabel="Код из Telegram"
              style={styles.input}
              value={telegramAuth.otp}
              onChangeText={telegramAuth.setOtp}
            />
          ) : (
            <Text style={styles.hint}>
              Сначала откройте @{TELEGRAM_BOT_NAME} и нажмите Start. ID — у @userinfobot.
            </Text>
          )}
          {telegramAuth.error ? <Text style={styles.error}>{telegramAuth.error}</Text> : null}
          <Pressable
            style={[styles.primary, loading && styles.primaryDisabled]}
            disabled={loading}
            onPress={() => void submitTelegram()}
            accessibilityLabel={telegramAuth.otpSent ? "Подтвердить код" : "Получить код в Telegram"}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {telegramAuth.otpSent ? "Подтвердить" : "Получить код в Telegram"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {tab === "email" ? (
        <View style={styles.panel}>
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
          {mfaRequired ? (
            <>
              <TextInput
                keyboardType="number-pad"
                placeholder="Код TOTP"
                accessibilityLabel="Код TOTP"
                style={styles.input}
                value={mfaCode}
                onChangeText={setMfaCode}
              />
              <Pressable
                style={[styles.primary, loading && styles.primaryDisabled]}
                disabled={loading}
                onPress={() => void submitMfa()}
                accessibilityLabel="Подтвердить MFA"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Подтвердить MFA</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
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
            </>
          )}
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
          ) : (
            <Text style={styles.hint}>
              SMS.ru иногда доставляет код 5–10 минут. Не запрашивайте повтор сразу.
            </Text>
          )}
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
          <Text style={styles.hint}>
            Google отключён (199-ФЗ). Для пилота используйте Яндекс ID, Telegram, телефон или email.
          </Text>
          <AuthButtons
            providers={RU_AUTH_PROVIDERS}
            onProviderPress={(p) => {
              if (p === "telegram" || p === "google") return;
              void onSocial(p);
            }}
            loading={oauthLoading}
            variant={mode === "sign-up" ? "register" : "login"}
          />
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
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tab: {
    width: "48%",
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
  hint: { color: "#64748B", fontSize: 12, lineHeight: 18 },
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
  specBlock: { gap: 6 },
  specLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  specScroll: { flexGrow: 0 },
  specChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  specChipActive: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  specChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  specChipTextActive: { color: "#075985" },
});
