"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  REGISTRATION_METHOD_HINTS,
  REGISTRATION_METHOD_LABELS,
  type AuthRegistrationMethod,
} from "@/lib/auth/registration-methods";

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  emailTab: ReactNode;
  phoneTab: ReactNode;
  socialTab: ReactNode;
  footer: ReactNode;
  defaultTab?: AuthRegistrationMethod;
  onTabChange?: (tab: AuthRegistrationMethod) => void;
  showMethodHints?: boolean;
};

export function AuthScreenShell({
  title,
  subtitle,
  emailTab,
  phoneTab,
  socialTab,
  footer,
  defaultTab = "email",
  onTabChange,
  showMethodHints = false,
}: AuthScreenShellProps) {
  const [tab, setTab] = useState<AuthRegistrationMethod>(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  function handleTabChange(next: string) {
    const value = next as AuthRegistrationMethod;
    setTab(value);
    onTabChange?.(value);
  }

  return (
    <section className="sonogyn-glass-card relative w-full max-w-md rounded-3xl border border-white/20 p-8 shadow-2xl dark:border-white/10">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">{subtitle}</p>
      </div>

      {showMethodHints ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Способ: {REGISTRATION_METHOD_LABELS[tab]}
          </p>
          <p className="mt-1">{REGISTRATION_METHOD_HINTS[tab]}</p>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
          <TabsTrigger value="email" className="rounded-xl text-xs sm:text-sm">
            📧 Почта
          </TabsTrigger>
          <TabsTrigger value="phone" className="rounded-xl text-xs sm:text-sm">
            📱 Телефон
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl text-xs sm:text-sm">
            💬 Соцсети
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">{emailTab}</TabsContent>
        <TabsContent value="phone">{phoneTab}</TabsContent>
        <TabsContent value="social">{socialTab}</TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-xs text-slate-500">
        Регистрируясь или входя, вы соглашаетесь с{" "}
        <Link href="/landing" className="underline">
          политикой конфиденциальности
        </Link>
        .
      </p>

      {footer}
    </section>
  );
}

export const authInputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white";

export function AuthMessage({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  const cls =
    tone === "success"
      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
  return <p className={cls}>{message}</p>;
}
