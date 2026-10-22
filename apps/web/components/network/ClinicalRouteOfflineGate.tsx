"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { OfflineGatePanel } from "@/components/network/OfflineGatePanel";
import { useNetworkStatus } from "@/components/network/NetworkProvider";
import { isNetworkOnlyPath } from "@/lib/network/network-only-path";

export function ClinicalRouteOfflineGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  if (isOnline || !isNetworkOnlyPath(pathname)) {
    return children;
  }

  return <OfflineGatePanel />;
}

/** Обёртка для произвольного блока (комposer, панель AI на странице). */
export function OfflineGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return children;
  return fallback ?? <OfflineGatePanel />;
}
