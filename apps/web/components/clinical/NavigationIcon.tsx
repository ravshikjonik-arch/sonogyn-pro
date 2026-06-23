"use client";

import type { NavigationIconName } from "@repo/types";

import { resolveNavigationIcon } from "@/lib/modules/resolve-navigation-icon";

type Props = {
  icon: NavigationIconName;
  moduleId?: string;
  className?: string;
};

/** Renders a Lucide icon for a navigation.config entry. Dev-warns on missing map entries. */
export function NavigationIcon({ icon, moduleId, className }: Props) {
  const Icon = resolveNavigationIcon(icon, moduleId);
  return <Icon className={className} aria-hidden />;
}
