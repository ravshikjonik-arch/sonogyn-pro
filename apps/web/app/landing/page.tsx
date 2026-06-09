import {
  Activity,
  ArrowRight,
  Brain,
  Calculator,
  HeartPulse,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Calculator,
    title: "Калькуляторы по гайдлайнам",
    body: "O-RADS · IOTA · BI-RADS · TI-RADS · FIGO · FMF · эластография — без «каши», только клинический сценарий.",
  },
  {
    icon: Activity,
    title: "Кейсы и обсуждения",
    body: "Разбор снимков между коллегами: лента, комментарии, закладки — как рабочая группа в кабинете УЗИ.",
  },
  {
    icon: ScanLine,
    title: "3D и визуализация",
    body: "Интерактивная матка (FIGO), 3D молочной железы (BI-RADS), IDEA — глубокий эндометриоз.",
  },
  {
    icon: Brain,
    title: "AI как ассистент",
    body: "Структурированные черновики и CDS-подсказки. Не диагноз — интерпретация остаётся за врачом.",
  },
];

const stats = [
  { value: "15+", label: "калькуляторов и модулей" },
  { value: "91", label: "КР МЗ РФ в каталоге" },
  { value: "3D", label: "процедурные модели" },
  { value: "RU", label: "базовый язык интерфейса" },
];

export default function LandingPage() {
  return (
    <div className="sonogyn-mesh-bg min-h-screen text-[var(--clinical-foreground)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--clinical-header)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/landing" className="flex items-center gap-3">
            <div className="sonogyn-brand-mark">SG</div>
            <div>
              <p className="text-sm font-black tracking-tight text-slate-950 dark:text-white">SonoGyn Pro</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--clinical-foreground-muted)]">
                УЗИ · АГ · клиника
              </p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Тарифы</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" className="sonogyn-cta-glow" asChild>
              <Link href="/register">Начать бесплатно</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-4 py-16 sm:py-20">
        <section className="sonogyn-hero-orbs grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8 sonogyn-enter">
            <p className="sonogyn-pill inline-flex items-center gap-2">
              <span className="sonogyn-live-dot" aria-hidden />
              <ShieldCheck className="h-3.5 w-3.5" />
              Для врачей УЗД и акушеров-гинекологов · не для пациентов
            </p>
            <h1 className="sonogyn-gradient-text text-4xl font-black tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06] sonogyn-enter sonogyn-enter-delay-1">
              Клинический помощник, которому можно доверять
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--clinical-foreground-muted)]">
              SonoGyn Pro объединяет калькуляторы по международным классификациям, 3D-визуализацию,
              клинические рекомендации и кейсы — в одном рабочем месте: браузер сейчас, приложение всегда под рукой.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="sonogyn-cta-glow gap-2" asChild>
                <Link href="/register">
                  Создать аккаунт <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">Уже есть аккаунт</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="sonogyn-stat-chip">
                  <p className="text-2xl font-black text-[var(--clinical-primary-deep)]">{s.value}</p>
                  <p className="mt-1 text-xs leading-snug text-[var(--clinical-foreground-muted)]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="sonogyn-glass-card sonogyn-enter sonogyn-enter-delay-2 overflow-hidden border-white/20 shadow-2xl">
            <div className="sonogyn-shimmer-bar h-2" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartPulse className="h-5 w-5 text-[var(--clinical-primary)]" />
                Что внутри платформы
              </CardTitle>
              <CardDescription>
                Архитектура «рабочая станция УЗИ»: мало кликов, предсказуемая навигация, тёмная тема для кабинета.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="flex gap-3 rounded-2xl bg-white/50 p-3 dark:bg-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{p.body}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="sonogyn-glass-card rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
                Сценарий запуска
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">4 шага до первого кейса</h2>
            </div>
            {process.env.NODE_ENV === "development" ? (
              <Button variant="outline" asChild>
                <Link href="/app">Открыть кабинет (dev)</Link>
              </Button>
            ) : null}
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Регистрация", body: "Email, телефон или соцсети — выберите язык интерфейса." },
              { step: "2", title: "Кабинет", body: "Рабочий стол: калькуляторы, 3D, КР, кейсы — одним меню." },
              { step: "3", title: "Кейс", body: "Фото УЗИ + описание + классификация — без авто-диагноза по пикселям." },
              { step: "4", title: "PRO", body: "Подписка для расширенного доступа — когда готовы масштабировать." },
            ].map((item) => (
              <li key={item.step} className="sonogyn-step-card">
                <span className="sonogyn-step-num">{item.step}</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Stethoscope,
              title: "FIGO · матка · аденомиоз",
              body: "3D-срез, маркеры миом, ниша рубца — учебный и рабочий режим.",
            },
            {
              icon: Sparkles,
              title: "PWA + мобильное",
              body: "Сайт ставится на рабочий стол; Android/iOS — тот же аккаунт и сценарии.",
            },
            {
              icon: ShieldCheck,
              title: "Безопасность данных",
              body: "Supabase Auth, RLS, шифрование чувствительных полей — готовность к аудиту.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="sonogyn-tile-hover border-slate-200/80 bg-white/90 dark:bg-[var(--clinical-card)]">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {item.body}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-[var(--clinical-primary)] to-violet-700 px-8 py-12 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-black sm:text-3xl">Готовы попробовать на реальном кейсе?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/85">
            Инструмент ассистивный. Заключение и решение — за лечащим врачом.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Зарегистрироваться</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/pricing">Смотреть тарифы</Link>
            </Button>
          </div>
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
          <p className="mt-4">SonoGyn Pro · Yakrav7700 · не является медицинским изделием без регистрации</p>
        </footer>
      </main>
    </div>
  );
}
