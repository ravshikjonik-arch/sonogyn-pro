import { hasAnalyticsConsentGranted } from "@/lib/privacy/analytics-consent";

/**
 * Воронка и продукт. Без ПДн и без содержимого полей калькуляторов.
 * Дублируется в dataLayer (GA) и ym reachGoal при наличии согласия и ID.
 */
export type FunnelEvent =
  | { name: "landing_view"; params?: Record<string, never> }
  | { name: "cta_click"; params: { cta: string; placement: string } }
  | { name: "signup_start"; params?: { method?: string } }
  | { name: "signup_complete"; params?: { method?: string } }
  | { name: "calculator_open"; params: { id: string } }
  | { name: "calculator_calc"; params: { id: string } }
  | { name: "case_save"; params?: Record<string, never> }
  | { name: "ai_request"; params: { mode: string } }
  | { name: "paywall_view"; params: { plan: string } }
  | { name: "checkout_start"; params: { plan: string } }
  | { name: "checkout_success"; params?: { plan?: string } }
  | { name: "install_prompt_shown"; params?: Record<string, never> }
  | { name: "install_accepted"; params?: Record<string, never> };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ym?: (id: number, method: string, ...rest: unknown[]) => void;
  }
}

function ymId(): number | null {
  const raw = process.env.NEXT_PUBLIC_YM_ID?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export function track(event: FunnelEvent): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsentGranted()) return;

  const payload = { event: event.name, ...(event.params ?? {}) };

  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(payload);
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event.name, event.params ?? {});
    }
  } catch {
    /* ignore */
  }

  try {
    const id = ymId();
    if (id != null && typeof window.ym === "function") {
      window.ym(id, "reachGoal", event.name, event.params ?? {});
    }
  } catch {
    /* ignore */
  }
}

/** Id для воронки: `/tools/calc/rads/o-rads` → `rads_o-rads`. */
export function calculatorAnalyticsIdFromPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  return (
    trimmed.replace(/^\/tools\/calc\//, "").replace(/\//g, "_") || trimmed
  );
}

const calculatorCalcFired = new Set<string>();

/**
 * Первый расчёт за вкладку (только id, без полей формы).
 * Повторные вызовы с тем же id игнорируются — без спама live-форм.
 */
export function trackCalculatorCalc(id: string): void {
  const key = id.trim();
  if (!key || calculatorCalcFired.has(key)) return;
  calculatorCalcFired.add(key);
  track({ name: "calculator_calc", params: { id: key } });
}
