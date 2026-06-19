import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PRICING_PLANS } from "./data";

type LandingPricingProps = {
  isAuthenticated: boolean;
};

export function LandingPricing({ isAuthenticated }: LandingPricingProps) {
  return (
    <section id="pricing" className="scroll-mt-24">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Тарифы</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">Free и PRO</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Сначала — бесплатное знакомство. PRO оформляется после входа через ЮKassa.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => {
          const href =
            plan.id === "pro" && isAuthenticated
              ? "/paywall"
              : plan.id === "free" && isAuthenticated
                ? "/app"
                : plan.href;
          const cta =
            plan.id === "pro" && isAuthenticated
              ? "Оформить PRO"
              : plan.id === "free" && isAuthenticated
                ? "Открыть кабинет"
                : plan.cta;

          return (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-[var(--clinical-primary)] shadow-lg shadow-blue-900/5"
                  : "border-slate-200"
              }
            >
              <CardHeader>
                <CardTitle className={plan.highlighted ? "text-[var(--clinical-primary-deep)]" : undefined}>
                  {plan.title}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 text-3xl font-black text-slate-950 dark:text-white">
                  {plan.price}
                  <span className="ml-2 text-sm font-normal text-[var(--clinical-foreground-muted)]">
                    / {plan.period}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
                {plan.features.map((feature) => (
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
