import {
  Activity,
  ArrowRight,
  Brain,
  Calculator,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--clinical-canvas)] text-[var(--clinical-foreground)]">
      <header className="border-b border-[var(--clinical-border)] bg-[var(--clinical-header)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--clinical-primary)] text-[11px] font-black text-white">
              MU
            </div>
            <span className="text-sm font-semibold tracking-tight">Medical Ultrasound SaaS</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Тарифы</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-16">
        <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--clinical-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--clinical-primary-deep)] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Designed for outcomes comparable to GE / Philips clinical UX patterns
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Production-ready ultrasound intelligence platform
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--clinical-foreground-muted)]">
              Unified calculators, longitudinal cases with realtime discussion, AI-assisted reporting,
              and an interactive 3D uterus workspace — delivered as an installable PWA with Supabase
              Auth and row-level security.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Начать в браузере <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">Уже есть аккаунт</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">Тарифы</Link>
              </Button>
            </div>
          </div>

          <Card className="border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartPulse className="h-5 w-5 text-[var(--clinical-primary)]" />
                Clinical value pillars
              </CardTitle>
              <CardDescription>
                Opinionated architecture for regulated environments — extend with your IRB / HIPAA
                controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-[var(--clinical-foreground-muted)]">
              <div className="flex gap-3">
                <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-[var(--clinical-primary-deep)]" />
                <div>
                  <p className="font-semibold text-slate-900">Structured calculators</p>
                  <p>O-RADS, BI-RADS, FIGO, LN/TI-RADS, POP-Q, FMF — card-first modular UX.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Activity className="mt-0.5 h-5 w-5 shrink-0 text-[var(--clinical-primary-deep)]" />
                <div>
                  <p className="font-semibold text-slate-900">Cases & realtime threads</p>
                  <p>Supabase Postgres + Realtime for likes, bookmarks, and threaded commentary.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Brain className="mt-0.5 h-5 w-5 shrink-0 text-[var(--clinical-primary-deep)]" />
                <div>
                  <p className="font-semibold text-slate-900">AI reporting backbone</p>
                  <p>Orchestrator-ready modules with typed structured outputs & export hooks.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-[var(--clinical-border)] bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-slate-950">Сценарий: сначала сайт, потом Android</h2>
          <ol className="mt-6 grid gap-4 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Регистрация", body: "Создайте аккаунт на этой странице (`/register`)." },
              { step: "2", title: "Вход", body: "Откройте кабинет (`/login`), при необходимости вернём на закрытый URL." },
              { step: "3", title: "Кабинет", body: "Command Center (`/app`), кейсы, калькуляторы, библиотека — всё в браузере." },
              { step: "4", title: "PRO", body: "Тарифы (`/pricing`), оплата после входа на `/paywall`. Приложение — этап 2." },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 rounded-2xl bg-[var(--clinical-muted)]/80 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--clinical-primary)] text-sm font-black text-white">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Web Vitals aware", body: "Lazy islands for Three.js, suspense boundaries, edge-ready CDN caching hints." },
            { title: "PWA installable", body: "Standalone display, theme-color, iOS meta — add push in phase 2." },
            { title: "Supabase native", body: "Email + Google OAuth, SSR cookie adapter, RLS templates included." },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--clinical-foreground-muted)]">{item.body}</CardContent>
            </Card>
          ))}
        </section>

        <footer className="border-t border-[var(--clinical-border)] pt-10 text-center text-xs text-[var(--clinical-foreground-muted)]">
          <div className="mx-auto mb-6 max-w-md">
            <TelegramChannelLink />
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/pricing" className="hover:text-[var(--clinical-primary-deep)]">
              Тарифы
            </Link>
            <Link href="/login" className="hover:text-[var(--clinical-primary-deep)]">
              Вход
            </Link>
            <Link href="/register" className="hover:text-[var(--clinical-primary-deep)]">
              Регистрация
            </Link>
          </div>
          <p className="mt-4">Medical Ultrasound SaaS · веб-платформа (PWA). Android — следующий этап.</p>
        </footer>
      </main>
    </div>
  );
}
