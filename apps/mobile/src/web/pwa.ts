import { Platform } from "react-native";
import { pwaWebConfig } from "../config/pwaWeb";
import { registerWebPushIfConfigured } from "./webPush";

function upsertMeta(name: string, content: string) {
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing) {
    existing.setAttribute("content", content);
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
}

function upsertLink(rel: string, href: string, attrs?: Record<string, string>) {
  const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.setAttribute("rel", rel);
  link.setAttribute("href", href);
  Object.entries(attrs ?? {}).forEach(([key, value]) => link.setAttribute(key, value));
  document.head.appendChild(link);
}

/** Уменьшает задержку 300ms на tap; не трогаем layout RN-компонентов */
function injectTouchFriendlyCss() {
  const id = "pwa-touch-friendly";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    html { -webkit-tap-highlight-color: rgba(0, 92, 185, 0.15); }
    body { touch-action: manipulation; }
  `;
  document.head.appendChild(style);
}

export function registerPwaRuntime() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  upsertLink("manifest", pwaWebConfig.manifestPath);
  upsertLink("apple-touch-icon", "/apple-touch-icon.png", { sizes: "180x180" });
  upsertMeta("theme-color", pwaWebConfig.themeColor);
  upsertMeta("application-name", pwaWebConfig.shortName);
  upsertMeta("apple-mobile-web-app-capable", "yes");
  upsertMeta("apple-mobile-web-app-status-bar-style", "default");
  upsertMeta("apple-mobile-web-app-title", pwaWebConfig.appleMobileWebAppTitle);
  upsertMeta("mobile-web-app-capable", "yes");
  upsertMeta(
    "viewport",
    "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
  );

  injectTouchFriendlyCss();

  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  /** Dev: SW caches stale Metro bundles → blank or stuck UI; drop registrations from prior sessions. */
  if (__DEV__) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => void r.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(pwaWebConfig.serviceWorkerPath, {
        scope: "/",
      })
      .then(() => registerWebPushIfConfigured())
      .catch(() => {
        /* установка из manifest возможна и без SW в некоторых сценариях */
      });
  });
}
