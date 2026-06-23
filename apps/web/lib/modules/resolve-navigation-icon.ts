import type { NavigationIconName } from "@repo/types";
import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  Calculator,
  CircleDot,
  ClipboardList,
  FileCheck,
  FileText,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Infinity,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  MessageCircle,
  Mic,
  ScanLine,
  ScanSearch,
  Send,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

/** Lucide components for `NavigationIconName` strings from `@repo/types` navigation.config. */
export const NAVIGATION_ICON_MAP: Record<NavigationIconName, LucideIcon> = {
  MessageCircle,
  HandHeart,
  Baby,
  Calculator,
  FileText,
  Layers,
  GraduationCap,
  CircleDot,
  Stethoscope,
  ScanLine,
  Brain,
  BookOpen,
  BookMarked,
  ClipboardList,
  Library,
  Users,
  HeartPulse,
  Sparkles,
  UserRound,
  LayoutDashboard,
  ScanSearch,
  FileCheck,
  BarChart3,
  Mic,
  Infinity,
  Lock,
  Send,
};

const DEFAULT_NAVIGATION_ICON = Layers;

const warnedKeys = new Set<string>();

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Resolves a navigation.config `icon` string to a Lucide React component.
 * Falls back to `Layers` when the name is missing from {@link NAVIGATION_ICON_MAP}.
 */
export function resolveNavigationIcon(icon: NavigationIconName, moduleId?: string): LucideIcon {
  const mapped = NAVIGATION_ICON_MAP[icon];
  if (mapped) return mapped;

  const warnKey = `${moduleId ?? "?"}::${icon}`;
  if (isDev() && !warnedKeys.has(warnKey)) {
    warnedKeys.add(warnKey);
    console.warn(
      `[navigation-icon] Missing Lucide mapping for module "${moduleId ?? "unknown"}" (icon: "${icon}"). Using fallback Layers.`,
    );
  }

  return DEFAULT_NAVIGATION_ICON;
}

export function isNavigationIconMapped(icon: NavigationIconName): boolean {
  return Boolean(NAVIGATION_ICON_MAP[icon]);
}
