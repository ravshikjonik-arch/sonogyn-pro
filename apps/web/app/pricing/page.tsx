import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatProPriceRub,
  MOBILE_STORE_LINE_RU,
  PAYMENT_PROVIDER_PUBLIC_NAME_RU,
  PWA_INSTALL_HINT_RU,
  SUPPORT_EMAIL,
  proSubscriptionPeriodLabelRu,
} from "@/lib/config/platform";
import { resolveProCheckoutPublicState } from "@/lib/payment/pro-checkout-public";
import { readDefaultProPriceRub } from "@/lib/payment/config";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Бесплатный демо-режим кабинета и подписка PRO для врачей УЗД и АГ.",
};

/**
 * Публичная витрина тарифов. Оплата PRO — после входа на `/paywall` (ЮKassa; Stripe — fallback env).
 * Если оплата не настроена — без цены и без кнопок «Оплатить».
 */
export default function PricingPage() {
  const proPriceRub = readDefaultProPriceRub();
  const proPriceLabel = formatProPriceRub(proPriceRub);
  const proPeriod = proSubscriptionPeriodLabelRu();
  const checkout = resolveProCheckoutPublicState();
  const paymentsLive = checkout.yookassaReady || checkout.stripeFallbackReady;

  return (
    <div className="min-h-screen bg-[var(--clinical-canvas)] text-[var(--clinical-foreground)]">
      <header className="border-b border-[var(--clinical-border)] bg-[var(--clinical-header)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/landing" className="text-sm font-semibold">
            ← На главную
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Тарифы</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
            Веб-кабинет и PWA — основной рабочий контур. {MOBILE_STORE_LINE_RU}{" "}
            {paymentsLive
              ? checkout.yookassaReady
                ? `Оплата PRO для РФ — через ${PAYMENT_PROVIDER_PUBLIC_NAME_RU}.`
                : `${PAYMENT_PROVIDER_PUBLIC_NAME_RU} здесь не настроена — после входа возможен запасной канал на /paywall.`
              : "Подписка PRO в подготовке: без цены и без кнопки оплаты, пока платёж не включён."}{" "}
            {PWA_INSTALL_HINT_RU}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Демо-режим: калькуляторы и открытые материалы без регистрации.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
              {["Клинический shell", "Базовые калькуляторы", "Лимиты на AI и кейсы без PRO"].map((t) => (
                <div key={t} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
            <CardContent className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/home">Открыть кабинет</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[var(--clinical-primary)] shadow-lg shadow-blue-900/5">
            <CardHeader>
              <CardTitle className="text-[var(--clinical-primary-deep)]">PRO</CardTitle>
              <CardDescription>
                {paymentsLive
                  ? `Подписка ${proPeriod}${checkout.yookassaReady ? ` · оплата ${PAYMENT_PROVIDER_PUBLIC_NAME_RU}` : ""}. Расширенные квоты платформы.`
                  : "Расширенные квоты платформы. Оплата откроется после настройки — без обещаний «оплатить сейчас»."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
              {(paymentsLive
                ? [
                    "Расширенные лимиты кейсов",
                    "Очередь AI-анализа",
                    `Оплата картой РФ, чек на email · ${proPriceLabel} / ${proPeriod}`,
                  ]
                : [
                    "Расширенные лимиты кейсов",
                    "Очередь AI-анализа",
                    "Уведомим, когда оплата станет доступна",
                  ]
              ).map((t) => (
                <div key={t} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
            <CardContent className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
              {paymentsLive ? (
                <>
                  <Button className="w-full" asChild>
                    <Link href="/login?redirectedFrom=/paywall">{checkout.ctaLabel}</Link>
                  </Button>
                  <p className="text-center text-xs text-slate-500">{checkout.footnote}</p>
                </>
              ) : (
                <>
                  <Button className="w-full" asChild>
                    <Link
                      href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SonoGyn Pro — интерес к PRO")}`}
                    >
                      Написать о PRO
                    </Link>
                  </Button>
                  <p className="text-center text-xs text-slate-500">
                    Без цены и без кнопки оплаты, пока платёжный провайдер не включён. {SUPPORT_EMAIL}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="mt-12 text-center text-xs text-slate-500">
          Образовательный контент без PHI. Перед клиническим применением — политики организации и аудит доступа.
        </p>
      </main>
    </div>
  );
}
