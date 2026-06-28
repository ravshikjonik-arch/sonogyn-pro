import * as Linking from "expo-linking";
import { useEffect } from "react";

import { apiTelegramSupabaseSession } from "../api/chatBackend";
import { exchangeMobileSessionCode } from "../lib/auth/emailAuthApi";
import { supabaseMobile } from "../lib/supabase/mobileClient";

/** Глобальная обработка deep link auth/callback (OAuth code, Telegram nonce, exchange code). */
export function useAuthDeepLinks(onSessionUpdated?: () => void) {
  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url || !supabaseMobile) return;

      const parsed = Linking.parse(url);

      const exchangeRaw = parsed.queryParams?.exchange_code;
      const exchangeCode =
        typeof exchangeRaw === "string" ? exchangeRaw : Array.isArray(exchangeRaw) ? exchangeRaw[0] : null;

      if (exchangeCode) {
        const result = await exchangeMobileSessionCode(exchangeCode);
        if (result.ok) {
          await supabaseMobile.auth.setSession(result.session);
          onSessionUpdated?.();
        }
        return;
      }

      const codeRaw = parsed.queryParams?.code;
      const code = typeof codeRaw === "string" ? codeRaw : Array.isArray(codeRaw) ? codeRaw[0] : null;

      if (code) {
        const { error } = await supabaseMobile.auth.exchangeCodeForSession(code);
        if (!error) onSessionUpdated?.();
        return;
      }

      const nonceRaw = parsed.queryParams?.telegram_nonce;
      const nonce =
        typeof nonceRaw === "string" ? nonceRaw : Array.isArray(nonceRaw) ? nonceRaw[0] : null;

      if (nonce) {
        try {
          const session = await apiTelegramSupabaseSession(nonce);
          await supabaseMobile.auth.setSession(session);
          onSessionUpdated?.();
        } catch {
          // экран входа покажет ошибку при ручной попытке
        }
      }
    }

    void Linking.getInitialURL().then((initial) => void handleUrl(initial));
    const sub = Linking.addEventListener("url", (event) => void handleUrl(event.url));
    return () => sub.remove();
  }, [onSessionUpdated]);
}
