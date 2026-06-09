import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getConfig } from "./src/modules/elastography/constants";
import { migrateOradsToSecureStore } from "./src/features/oradsPro/storage/oradsStorage";
import { migrateHistoryToSecureStore } from "./src/modules/elastography/utils/historyStorage";
import AppStack from "./src/navigation/AppStack";
import { registerPwaRuntime } from "./src/web/pwa";

type BoundaryProps = { children: ReactNode };
type BoundaryState = { error: Error | null };

/** Ловит падение при первом рендере — иначе на web часто только белый экран без текста в UI */
class RootErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[RootErrorBoundary]", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const msg = this.state.error.message;
      return (
        <View style={boundaryStyles.root}>
          <Text style={boundaryStyles.title}>Не удалось запустить интерфейс</Text>
          <Text style={boundaryStyles.hint}>
            Откройте консоль браузера (F12 → Console). На Mac часто помогает жёсткое обновление и одинаковый порт с
            терминалом Expo.
          </Text>
          <ScrollView style={boundaryStyles.scroll}>
            <Text selectable style={boundaryStyles.mono}>
              {msg}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const boundaryStyles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === "web" ? 48 : 24,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#991b1b", marginBottom: 12 },
  hint: { fontSize: 14, color: "#57534e", marginBottom: 16, lineHeight: 20 },
  scroll: { maxHeight: 280 },
  mono: { fontSize: 13, color: "#1c1917", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

export default function App() {
  useEffect(() => {
    registerPwaRuntime();
  }, []);

  /** Предзагрузка Remote Config эластографии при старте приложения */
  useEffect(() => {
    void getConfig().catch((error: unknown) => {
      console.warn("[App] Elastography Remote Config:", error);
    });
  }, []);

  /** Миграция локальной клиники в SecureStore (один раз после обновления) */
  useEffect(() => {
    void migrateHistoryToSecureStore().then((migrated) => {
      if (migrated) {
        console.log("[Elastography] История перенесена в защищённое хранилище");
      }
    });
    void migrateOradsToSecureStore().then((migrated) => {
      if (migrated) {
        console.log("[O-RADS] Данные перенесены в защищённое хранилище");
      }
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") return;

    const show = (title: string, detail: string) => {
      const id = "expo-web-fatal-overlay";
      if (document.getElementById(id)) return;
      const root = document.createElement("div");
      root.id = id;
      root.setAttribute(
        "style",
        "position:fixed;inset:0;padding:24px;background:#fff7ed;color:#1c1917;z-index:2147483647;overflow:auto;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif",
      );
      const h = document.createElement("h2");
      h.textContent = title;
      h.setAttribute("style", "margin:0 0 12px;font-size:18px;color:#9a3412");
      const pre = document.createElement("pre");
      pre.textContent = detail;
      pre.setAttribute(
        "style",
        "margin:0;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.45",
      );
      root.appendChild(h);
      root.appendChild(pre);
      document.body.appendChild(root);
    };

    const onErr = (e: ErrorEvent) => {
      const stack = e.error instanceof Error ? (e.error.stack ?? "") : "";
      show("Ошибка JavaScript", `${e.message}\n\n${stack}`);
    };
    const onRej = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const msg = r instanceof Error ? `${r.message}\n\n${r.stack ?? ""}` : String(r);
      show("Необработанное отклонение Promise", msg);
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <AppStack />
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
