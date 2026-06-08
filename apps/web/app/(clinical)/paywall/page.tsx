"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Subscription upsell shown when quota limits are exceeded or when navigating manually from settings.
 */
export default function PaywallPage() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY;
    if (!priceId) {
      setError("Billing is not configured (NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const body = (await res.json()) as { url?: string; error?: unknown };
      if (!res.ok || !body.url) {
        setError(typeof body.error === "string" ? body.error : "Checkout failed");
        return;
      }
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Ultrasound PRO
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Unlock AI-assisted teaching cases and unlimited analyses
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          PHI-safe architecture with audit trails, HIPAA-aligned controls, and Stripe-backed subscriptions with a
          seven-day evaluation window for qualified clinicians.
        </p>
      </header>

      {checkout === "cancel" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Checkout was canceled — no charges were made.
        </div>
      ) : null}

      <div className="grid gap-6 rounded-2xl border border-[var(--clinical-border)] bg-white p-8 shadow-sm md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--clinical-foreground)]">Included with PRO</p>
          <ul className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            <li>• Unlimited mocked AI segmentation jobs (production swaps model endpoint)</li>
            <li>• Higher monthly teaching case quotas</li>
            <li>• Priority moderation review lane</li>
            <li>• Stripe Customer Portal for invoices</li>
          </ul>
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-[var(--clinical-muted)] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              Monthly
            </p>
            <p className="mt-2 text-4xl font-black text-[var(--clinical-foreground)]">$49</p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">Price placeholder — configure Stripe Price IDs.</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full" size="lg" type="button" disabled={busy} onClick={() => void startCheckout()}>
              {busy ? "Redirecting…" : "Start 7-day trial"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile">Back to profile</Link>
            </Button>
            {error ? <p className="text-center text-xs font-semibold text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
