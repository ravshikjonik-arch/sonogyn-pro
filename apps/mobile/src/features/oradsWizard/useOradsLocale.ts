import { useMemo } from "react";
import { I18nManager } from "react-native";

import i18n from "../../i18n";

/**
 * O-RADS wizard strings via the app i18n-js bundle (`orads.*` namespace).
 * RTL: rely on I18nManager.isRTL / orads.meta.rtl — do not hardcode flexDirection in screens.
 */
export function useOradsLocaleStrings() {
  const locale = i18n.locale;

  return useMemo(() => {
    const rtl = i18n.t("orads.meta.rtl") === "true" || I18nManager.isRTL;

    function t(key: string, options?: Record<string, string | number>): string {
      return i18n.t(key, options);
    }

    return { t, locale, rtl };
  }, [locale]);
}

export type OradsLocaleStrings = ReturnType<typeof useOradsLocaleStrings>;
