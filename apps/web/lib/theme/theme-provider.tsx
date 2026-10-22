"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CLINICAL_THEME_STORAGE_KEY,
  getSystemTheme,
  resolveClinicalTheme,
  type ThemeMode,
} from "@/lib/theme/theme-paths";

export type { ThemeMode };

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyResolvedTheme(resolved: "light" | "dark", mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  if (mode === "system") {
    document.documentElement.removeAttribute("data-theme-forced");
  } else {
    document.documentElement.setAttribute("data-theme-forced", mode);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(CLINICAL_THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  useEffect(() => {
    const next = resolveClinicalTheme(mode, pathname);
    setResolved(next);
    applyResolvedTheme(next, mode);
  }, [mode, pathname]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = resolveClinicalTheme("system", pathname);
      setResolved(next);
      applyResolvedTheme(next, mode);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, pathname]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(CLINICAL_THEME_STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    const onMarketing = pathname === "/landing" || pathname.startsWith("/lp/");
    if (onMarketing) return;
    setMode(resolved === "dark" ? "light" : "dark");
  }, [pathname, resolved, setMode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { getSystemTheme };
