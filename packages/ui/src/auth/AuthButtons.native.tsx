import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AuthButtonsVariant, AuthProvider } from "./types";

export type { AuthProvider, AuthButtonsVariant };

interface AuthButtonsProps {
  onProviderPress: (provider: AuthProvider) => void;
  loading?: AuthProvider | null;
  variant?: AuthButtonsVariant;
}

const PROVIDERS: {
  id: AuthProvider;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: "google", label: "Google", icon: "🔵", color: "#4285F4" },
  { id: "vk", label: "ВКонтакте", icon: "🟦", color: "#0077FF" },
  { id: "yandex", label: "Яндекс ID", icon: "🔴", color: "#FC3F1D" },
  { id: "telegram", label: "Telegram", icon: "✈️", color: "#26A5E4" },
];

export function AuthButtons({ onProviderPress, loading, variant = "login" }: AuthButtonsProps) {
  const prefix = variant === "register" ? "Зарегистрироваться через" : "Войти через";

  return (
    <View style={styles.wrap}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${prefix} ${p.label}`}
          disabled={loading === p.id}
          onPress={() => onProviderPress(p.id)}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: p.color, opacity: loading === p.id ? 0.6 : pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.btnText}>
            {p.icon} {prefix} {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
