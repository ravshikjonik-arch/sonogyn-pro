"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";

import { OFFLINE_QUICK_LINKS } from "@/lib/pwa/offline-precache-routes";
import {
  NETWORK_OFFLINE_GATE_BODY_RU,
  NETWORK_OFFLINE_GATE_TITLE_RU,
} from "@/lib/network/network-messages";

/** Замена контента сетевых разделов при offline (честный UI, без ложных форм). */
export function OfflineGatePanel() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10 lg:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]">
          <WifiOff className="h-6 w-6 text-[var(--clinical-foreground-muted)]" aria-hidden />
        </span>
        <h1 className="text-xl font-black tracking-tight text-[var(--clinical-foreground)]">
          {NETWORK_OFFLINE_GATE_TITLE_RU}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {NETWORK_OFFLINE_GATE_BODY_RU}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {OFFLINE_QUICK_LINKS.slice(0, 5).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 text-sm font-medium text-[var(--clinical-foreground)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
        Когда сеть вернётся,{" "}
        <button
          type="button"
          className="font-medium text-[var(--clinical-primary-deep)] underline underline-offset-2"
          onClick={() => window.location.reload()}
        >
          обновите страницу
        </button>
        .
      </p>
    </div>
  );
}
