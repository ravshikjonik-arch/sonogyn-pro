"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AUTH_TAB_ORDER,
  REGISTRATION_METHOD_HINTS,
  REGISTRATION_METHOD_LABELS,
  type AuthRegistrationMethod,
} from "@/lib/auth/registration-methods";
import { isAuthEmailOnlyClient } from "@/lib/auth/auth-methods-config";
import { isPilotClosedAccessClient } from "@/lib/auth/auth-pilot-config";

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  telegramTab: ReactNode;
  emailTab: ReactNode;
  phoneTab: ReactNode;
  socialTab?: ReactNode;
  footer: ReactNode;
  defaultTab?: AuthRegistrationMethod;
  onTabChange?: (tab: AuthRegistrationMethod) => void;
  showMethodHints?: boolean;
};

const TAB_UI: Record<AuthRegistrationMethod, { emoji: string; short: string }> = {
  phone: { emoji: "📱", short: "SMS" },
  social: { emoji: "🇷🇺", short: "Яндекс ID" },
  telegram: { emoji: "✈️", short: "Telegram" },
  email: { emoji: "📧", short: "Почта" },
};

export function AuthScreenShell({
  title,
  subtitle,
  telegramTab,
  emailTab,
  phoneTab,
  socialTab,
  footer,
  defaultTab = "phone",
  onTabChange,
  showMethodHints = false,
}: AuthScreenShellProps) {
  const emailOnly = isAuthEmailOnlyClient();
  const closedPilot = isPilotClosedAccessClient();
  const [tab, setTab] = useState<AuthRegistrationMethod>(emailOnly ? "email" : defaultTab);

  useEffect(() => {
    setTab(emailOnly ? "email" : defaultTab);
  }, [defaultTab, emailOnly]);

  function handleTabChange(next: string) {
    if (emailOnly) return;
    const value = next as AuthRegistrationMethod;
    setTab(value);
    onTabChange?.(value);
  }

  const visibleTabs = AUTH_TAB_ORDER.filter((id) => (id === "social" ? Boolean(socialTab) : true));

  return (
    <section className="sonogyn-glass-card relative w-full max-w-md rounded-3xl border border-white/20 p-8 shadow-2xl dark:border-white/10">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">{subtitle}</p>
      </div>

      {showMethodHints && !emailOnly && !closedPilot ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Способ: {REGISTRATION_METHOD_LABELS[tab]}
          </p>
          <p className="mt-1">{REGISTRATION_METHOD_HINTS[tab]}</p>
        </div>
      ) : null}

      {emailOnly ? (
        <div className="w-full space-y-6">
          {socialTab ? (
            <>
              {socialTab}
              <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                или email
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
            </>
          ) : null}
          {emailTab}
        </div>
      ) : closedPilot ? (
        <div className="w-full">{telegramTab}</div>
      ) : (
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList
            className={`mb-6 grid w-full gap-1 rounded-2xl bg-[var(--clinical-muted)] p-1 ${
              visibleTabs.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
            }`}
          >
            {visibleTabs.map((id) => (
              <TabsTrigger key={id} value={id} className="relative rounded-xl text-[11px] sm:text-xs">
                <span className="mr-0.5">{TAB_UI[id].emoji}</span>
                {TAB_UI[id].short}
                {id === "phone" ? (
                  <span className="ml-1 hidden rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 sm:inline">
                    РФ
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="phone">{phoneTab}</TabsContent>
          {socialTab ? <TabsContent value="social">{socialTab}</TabsContent> : null}
          <TabsContent value="telegram">{telegramTab}</TabsContent>
          <TabsContent value="email">{emailTab}</TabsContent>
        </Tabs>
      )}

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
  "sonogyn-auth-input mt-2 w-full rounded-2xl border border-[var(--clinical-border)] bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950/80 dark:text-slate-50 dark:placeholder:text-slate-400";

export function AuthMessage({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  const cls =
    tone === "success"
      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
  return (
    <p className={cls} data-testid={tone === "error" ? "auth-error-message" : "auth-success-message"}>
      {message}
    </p>
  );
}
