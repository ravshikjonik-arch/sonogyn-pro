"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  hasAnalyticsConsentGranted,
  isFirebaseAnalyticsConfigured,
  readAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/privacy/analytics-consent";

/**
 * Показывается только если Firebase Analytics сконфигурирован и согласие ещё не выбрано.
 * Необходимые cookies сессии не требуют баннера.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFirebaseAnalyticsConfigured()) return;
    if (readAnalyticsConsent() != null) return;
    setVisible(true);
  }, []);

  function choose(value: AnalyticsConsent) {
    writeAnalyticsConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на аналитические cookies"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-[var(--clinical-border)] bg-[var(--clinical-card)]/95 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--clinical-foreground)]">
          Мы используем необходимые cookies для входа. Аналитика (Firebase) — только с вашего
          согласия. Подробнее в{" "}
          <Link href="/privacy" className="font-medium underline underline-offset-2">
            политике конфиденциальности
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => choose("denied")}>
            Только необходимые
          </Button>
          <Button type="button" size="sm" onClick={() => choose("granted")}>
            Разрешить аналитику
          </Button>
        </div>
      </div>
    </div>
  );
}

/** For tests / diagnostics — not rendered. */
export function analyticsConsentGrantedForClient(): boolean {
  return hasAnalyticsConsentGranted();
}
