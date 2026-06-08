"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  emailTab: ReactNode;
  phoneTab: ReactNode;
  socialTab: ReactNode;
  footer: ReactNode;
};

export function AuthScreenShell({ title, subtitle, emailTab, phoneTab, socialTab, footer }: AuthScreenShellProps) {
  return (
    <section className="sonogyn-glass-card relative w-full max-w-md rounded-3xl border border-white/20 p-8 shadow-2xl dark:border-white/10">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">{subtitle}</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
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
      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700";
  return <p className={cls}>{message}</p>;
}
