import { useCallback, useState } from "react";

import { sendTelegramOtpViaApi, verifyTelegramOtpViaApi } from "../lib/auth/emailAuthApi";
import { supabaseMobile } from "../lib/supabase/mobileClient";

export type TelegramRegistrationMeta = {
  full_name?: string;
  birth_date?: string;
  birth_year?: number;
  specialization?: string;
  preferred_locale?: string;
};

export function useTelegramAuth() {
  const [chatId, setChatId] = useState("");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);

  const sendOtp = useCallback(
    async (createUser = false, turnstileToken?: string) => {
      if (!supabaseMobile) {
        setError("Supabase не настроен (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).");
        return false;
      }

      const normalized = chatId.trim();
      if (!/^\d{5,20}$/.test(normalized)) {
        setError("Укажите числовой Telegram ID (5–20 цифр).");
        return false;
      }

      setBusy(true);
      setError(null);
      try {
        const result = await sendTelegramOtpViaApi(normalized, createUser, turnstileToken, fallbackEmail.trim() || undefined);
        if (!result.ok) {
          setRequiresCaptcha(Boolean(result.requiresCaptcha));
          setError(result.error);
          return false;
        }
        setOtpSent(true);
        return true;
      } finally {
        setBusy(false);
      }
    },
    [chatId, fallbackEmail],
  );

  const verifyOtp = useCallback(
    async (registration?: TelegramRegistrationMeta) => {
      if (!supabaseMobile) {
        setError("Supabase не настроен.");
        return false;
      }

      setBusy(true);
      setError(null);
      try {
        const result = await verifyTelegramOtpViaApi(chatId.trim(), otp.trim(), {
          ...registration,
          createUser: true,
        });
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        if (result.session) {
          await supabaseMobile.auth.setSession(result.session);
        }
        return true;
      } finally {
        setBusy(false);
      }
    },
    [chatId, otp],
  );

  return {
    chatId,
    setChatId,
    fallbackEmail,
    setFallbackEmail,
    otp,
    setOtp,
    otpSent,
    setOtpSent,
    busy,
    error,
    setError,
    requiresCaptcha,
    sendOtp,
    verifyOtp,
  };
}
