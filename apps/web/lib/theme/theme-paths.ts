export type ThemeMode = "light" | "dark" | "system";

export const CLINICAL_THEME_STORAGE_KEY = "clinical-theme-mode";

/** Маркетинговый shell — всегда тёмный, независимо от выбора в кабинете. */
export function isMarketingShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/landing" || pathname.startsWith("/lp/");
}

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Рабочая зона: system → OS; маркетинг → dark. */
export function resolveClinicalTheme(
  mode: ThemeMode,
  pathname: string | null | undefined,
): "light" | "dark" {
  if (isMarketingShellPath(pathname)) return "dark";
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return getSystemTheme();
}

/** Inline boot — до React, без FOUC (синхрон с ThemeProvider). */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem("${CLINICAL_THEME_STORAGE_KEY}");var p=location.pathname;var land=p==="/landing"||/^\\/lp\\//.test(p);var sys=window.matchMedia("(prefers-color-scheme: dark)").matches;var d;if(land)d=true;else if(m==="dark")d=true;else if(m==="light")d=false;else d=sys;document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.classList.toggle("dark",d);if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme-forced",m);else document.documentElement.removeAttribute("data-theme-forced");}catch(e){}})();`;
