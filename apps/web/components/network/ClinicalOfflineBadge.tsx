"use client";

import { WifiOff } from "lucide-react";

import { useNetworkStatus } from "@/components/network/NetworkProvider";
import { NETWORK_OFFLINE_BADGE_RU } from "@/lib/network/network-messages";
import { cn } from "@/lib/utils/cn";

export function ClinicalOfflineBadge({ className }: { className?: string }) {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-950 dark:text-amber-100",
        className,
      )}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {NETWORK_OFFLINE_BADGE_RU}
    </span>
  );
}
