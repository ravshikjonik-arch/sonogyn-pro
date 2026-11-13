import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PAYMENT_PROVIDER_PUBLIC_NAME_RU, SUPPORT_EMAIL } from "@/lib/config/platform";
import { resolveProCheckoutPublicState } from "@/lib/payment/pro-checkout-public";

import { PRICING_PLANS } from "./data";

type LandingPricingProps = {
  isAuthenticated: boolean;
};

export function LandingPricing({ isAuthenticated }: LandingPricingProps) {
  const checkout = resolveProCheckoutPublicState();
  const paymentsLive = checkout.yookassaReady || checkout.stripeFallbackReady;

  return (
    <section id="pricing" className="scroll-mt-24">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Пилот · тарифы
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
          Free сейчас · PRO следом
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
          {paymentsLive
            ? `Сначала — бесплатное знакомство и демо-кабинет. PRO оформляется после входа через ${PAYMENT_PROVIDER_PUBLIC_NAME_RU}.`
            : "Сейчас бесплатный пилот для врачей: кабинет и калькуляторы без оплаты. PRO (лимиты и AI) — в листе ожидания, без кнопки «оплатить»."}
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => {
          const isPro = plan.id === "pro";
          const href =
            isPro && !paymentsLive
              ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SonoGyn Pro — лист ожидания PRO")}`
              : isPro && isAuthenticated
                ? "/profile/pro"
                : plan.id === "free" && isAuthenticated
                  ? "/app"
                  : plan.href;
          const cta =
            isPro && !paymentsLive
              ? "Список ожидания PRO"
              : isPro && isAuthenticated
                ? "Оформить PRO"
                : plan.id === "free" && isAuthenticated
                  ? "Открыть кабинет"
                  : plan.cta;
          const price = isPro && !paymentsLive ? "пилот" : plan.price;
          const period = isPro && !paymentsLive ? "лист ожидания" : plan.period;
          const description =
            isPro && !paymentsLive
              ? "Расширенные лимиты кейсов и AI. Оплата картой РФ — после ЮKassa; сейчас оставьте email в письме."
              : plan.description;
          const features =
            isPro && !paymentsLive
              ? ["Расширенные лимиты кейсов", "Очередь AI-анализа", "Приоритет в листе ожидания"]
              : [...plan.features];

          return (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-card)] shadow-[var(--clinical-card-shadow)]"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-card)]"
              }
            >
              <CardHeader>
                <CardTitle className={plan.highlighted ? "text-[var(--clinical-primary-deep)]" : undefined}>
                  {plan.title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
                <p className="pt-2 text-3xl font-black text-[var(--clinical-foreground)]">
                  {price}
                  <span className="ml-2 text-sm font-normal text-[var(--clinical-foreground-muted)]">
                    / {period}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
                {features.map((feature) => (
                  <div key={feature} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardContent className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
                <Button variant={plan.highlighted ? "default" : "secondary"} className="w-full" asChild>
                  <Link href={href}>{cta}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-[var(--clinical-foreground-muted)]">
        Подробнее — на{" "}
        <Link href="/pricing" className="font-medium text-[var(--clinical-primary-deep)] hover:underline">
          странице тарифов
        </Link>
        . Образовательный контент без PHI.
      </p>
    </section>
  );
}
