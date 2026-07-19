import { useColorScheme } from "react-native";

import { theme } from "../../theme";

export function useCervixTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    isDark,
    colors: {
      bg: isDark ? "#0f172a" : theme.colors.background,
      card: isDark ? "#1e293b" : theme.colors.card,
      text: isDark ? "#f1f5f9" : theme.colors.text,
      textMuted: isDark ? "#94a3b8" : theme.colors.textSecondary,
      border: isDark ? "#334155" : theme.colors.border,
      primary: isDark ? "#38bdf8" : theme.colors.primary,
      accent: isDark ? "#f472b6" : "#be185d",
      warningBg: isDark ? "#422006" : "#fffbeb",
      warningBorder: isDark ? "#92400e" : "#fcd34d",
      warningText: isDark ? "#fde68a" : "#92400e",
      chip: isDark ? "#334155" : "#f1f5f9",
      chipOn: isDark ? "#0369a1" : "#dbeafe",
      chipOnText: isDark ? "#e0f2fe" : "#1e3a8a",
      riskLow: isDark ? "#059669" : "#059669",
      riskModerate: isDark ? "#d97706" : "#d97706",
      riskHigh: isDark ? "#dc2626" : "#dc2626",
    },
  };
}

export type CervixTheme = ReturnType<typeof useCervixTheme>;
