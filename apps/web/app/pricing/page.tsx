import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Бесплатный старт и подписка PRO с пробным периодом для платформы УЗИ-образования.",
};

/**
 * Публичная страница тарифов (веб-витрина). Оплата и Stripe Checkout доступны после входа на `/paywall`.
 */
export default function PricingPage() {
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
            Сначала запускаем веб-версию: один аккаунт в браузере, затем — приложение для Android. Цены и лимиты настраиваются в Stripe.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Знакомство с калькуляторами и открытыми материалами.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
              {["Клинический shell", "Базовые калькуляторы", "Лимиты на AI и кейсы PRO"].map((t) => (
                <div key={t} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
            <CardContent className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/register">Начать бесплатно</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[var(--clinical-primary)] shadow-lg shadow-blue-900/5">
            <CardHeader>
              <CardTitle className="text-[var(--clinical-primary-deep)]">PRO</CardTitle>
              <CardDescription>Подписка с 7-дневным триалом (Stripe). Полный доступ к квотам платформы.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
              {["Расширенные лимиты кейсов", "Очередь AI-анализа (mock → ваш сервис)", "Портал клиента Stripe для счетов"].map((t) => (
                <div key={t} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
            <CardContent className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
              <Button className="w-full" asChild>
                <Link href="/login">Войти и оформить PRO</Link>
              </Button>
              <p className="text-center text-xs text-slate-500">После входа откроется `/paywall` с Checkout.</p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-12 text-center text-xs text-slate-500">
          Образовательный контент без PHI. Перед клиническим применением — BAA, политики и аудит.
        </p>
      </main>
    </div>
  );
}
