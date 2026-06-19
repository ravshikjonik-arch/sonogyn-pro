import type { AuthButtonsVariant, AuthProvider } from "./types";

export type { AuthProvider, AuthButtonsVariant };

interface AuthButtonsProps {
  onProviderPress: (provider: AuthProvider) => void;
  loading?: AuthProvider | null;
  variant?: AuthButtonsVariant;
  /** По умолчанию — все провайдеры из списка. */
  providers?: AuthProvider[];
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
];

export function AuthButtons({
  onProviderPress,
  loading,
  variant = "login",
  providers,
}: AuthButtonsProps) {
  const prefix = variant === "register" ? "Зарегистрироваться через" : "Войти через";
  const visible = providers?.length ? PROVIDERS.filter((p) => providers.includes(p.id)) : PROVIDERS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {visible.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onProviderPress(p.id)}
          disabled={loading === p.id}
          aria-label={`${prefix} ${p.label}`}
          style={{
            padding: "12px 20px",
            backgroundColor: p.color,
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading === p.id ? "wait" : "pointer",
            opacity: loading === p.id ? 0.6 : 1,
          }}
        >
          {p.icon} {prefix} {p.label}
        </button>
      ))}
    </div>
  );
}
