"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

function TurnstileRedirect() {
  const searchParams = useSearchParams();
  const redirectRaw = searchParams.get("redirect");

  const onToken = useCallback(
    (token: string) => {
      if (!redirectRaw) return;
      try {
        const target = new URL(redirectRaw);
        target.searchParams.set("turnstile_token", token);
        window.location.href = target.toString();
      } catch {
        /* invalid redirect */
      }
    },
    [redirectRaw],
  );

  if (!redirectRaw) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-slate-600">Missing redirect parameter.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm font-semibold text-slate-800">Подтвердите, что вы не робот</p>
      <TurnstileWidget onToken={onToken} />
    </main>
  );
}

export default function TurnstileMobilePage() {
  return (
    <Suspense fallback={null}>
      <TurnstileRedirect />
    </Suspense>
  );
}
