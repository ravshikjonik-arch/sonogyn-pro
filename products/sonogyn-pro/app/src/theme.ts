export const theme = {
  colors: {
    background: "#F7F9FB",
    primary: "#1E88E5",
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    success: "#2E7D32",
    warning: "#F9A825",
    danger: "#D32F2F",
    card: "#FFFFFF",
    border: "#E5E7EB",
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 16,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
  },
  shadow: {
    card: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
  },
  motion: {
    fast: 170,
    normal: 200,
  },
} as const;

export type AppTheme = typeof theme;
