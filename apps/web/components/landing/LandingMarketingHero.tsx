import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Calculator,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { LandingAuthCard } from "@/components/landing/LandingAuthCard";

const TOP_PILLS = [
  { icon: Sparkles, label: "AI 24/7" },
  { icon: MessageSquare, label: "Чат врачей" },
  { icon: Calculator, label: "Калькуляторы" },
  { icon: ShieldCheck, label: "Evidence" },
  { icon: BookOpen, label: "Обучение" },
] as const;

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-ассистент врача",
    text: "Умный анализ и поддержка клинических решений",
  },
  {
    icon: MessageSquare,
    title: "Чат и сообщество",
    text: "Обсуждение кейсов с коллегами 24/7",
  },
  {
    icon: Calculator,
    title: "Калькуляторы и классификации",
    text: "30+ инструментов: O-RADS, BI-RADS, TI-RADS, IOTA, FMF",
  },
  {
    icon: BookOpen,
    title: "Обучение и гайды",
    text: "Курсы, 3D-анатомия и клинические рекомендации",
  },
  {
    icon: Lock,
    title: "Безопасность и конфиденциальность",
    text: "Защита данных и доступ для специалистов",
  },
] as const;

const SCALES = [
  "O-RADS",
  "BI-RADS",
  "TI-RADS",
  "IOTA",
  "ADNEX",
  "FMF",
  "Bishop",
  "VBAC",
  "EFW",
  "FIGO",
] as const;

const STATS = [
  { value: "30+", label: "калькуляторов и шкал" },
  { value: "Кейсы", label: "галерея и обсуждения" },
  { value: "Пилот", label: "доступ для врачей" },
  { value: "24/7", label: "AI и чат коллег" },
] as const;

const HERO_ART = "/marketing/sonogyn-universe-hero.png";

type Props = {
  isAuthenticated: boolean;
};

export function LandingMarketingHero({ isAuthenticated }: Props) {
  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#05030a] text-white"
      aria-labelledby="landing-marketing-heading"
    >
      {/* Full-bleed creative */}
      <div className="absolute inset-0">
        <Image
          src={HERO_ART}
          alt=""
          fill
          priority
          className="object-cover object-[58%_center] opacity-90 sm:object-[62%_center] lg:object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-[#05030a]/55 lg:bg-[#05030a]/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#05030a] via-[#05030a]/88 to-[#05030a]/25 lg:via-[#05030a]/70 lg:to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#05030a] via-transparent to-[#05030a]/50"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(124,58,237,0.22),transparent_55%)]"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24 lg:px-8 lg:pt-28">
        {/* Top brand strip */}
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-base font-black shadow-[0_0_28px_rgba(168,85,247,0.6)] ring-1 ring-white/20">
              S
            </span>
            <div>
              <p className="text-base font-black tracking-tight">SonoGyn Pro</p>
              <p className="mt-0.5 max-w-md text-[10px] font-bold uppercase leading-snug tracking-[0.06em] text-violet-200/75 sm:text-[11px]">
                Интеллектуальная платформа для акушеров-гинекологов и врачей УЗИ
              </p>
            </div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {TOP_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-black/35 px-3 py-1.5 text-[11px] font-bold text-violet-50 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-5 xl:gap-8">
          {/* Left glass panel */}
          <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-violet-300/20 bg-black/45 p-5 shadow-[0_0_48px_rgba(88,28,135,0.45)] backdrop-blur-xl sm:p-6">
              <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-violet-300">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                Для врача, не для пациента
              </p>
              <h1
                id="landing-marketing-heading"
                className="text-[1.75rem] font-black uppercase leading-[1.08] tracking-tight sm:text-3xl xl:text-[2.05rem]"
              >
                Ваша вселенная женского здоровья
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-violet-50/80 sm:text-[15px]">
                Всё, что нужно врачу — в одной платформе с искусственным интеллектом
              </p>

              <ul className="mt-5 space-y-3">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/20 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.45)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="text-xs leading-snug text-violet-100/65">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Center — keep creative visible (desktop) */}
          <div className="order-3 hidden min-h-[280px] lg:order-2 lg:col-span-4 lg:block xl:col-span-5" aria-hidden>
            <div className="h-full w-full" />
          </div>

          {/* Auth over join zone */}
          <div className="order-1 flex flex-col justify-center gap-3 lg:order-3 lg:col-span-4 xl:col-span-4">
            <div className="lg:hidden">
              <h2 className="text-2xl font-black uppercase leading-tight tracking-tight">
                Ваша вселенная женского здоровья
              </h2>
              <p className="mt-2 text-sm text-violet-100/80">
                Всё, что нужно врачу — в одной платформе с ИИ
              </p>
            </div>

            <LandingAuthCard className="shadow-[0_0_56px_rgba(124,58,237,0.55)]" />

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <aside className="rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">3D-анатомия</p>
                  <p className="mt-1 text-xs font-semibold text-white">FIGO · модели</p>
                </aside>
                <aside className="rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">Evidence</p>
                  <p className="mt-1 text-xs font-semibold text-white">КР · PubMed</p>
                </aside>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-violet-100/55">
              <span>Также:</span>
              <Link href="/login" className="font-semibold text-violet-200 underline-offset-2 hover:underline">
                полная форма входа
              </Link>
              <span>·</span>
              <Link href="/app" className="font-semibold text-violet-200 underline-offset-2 hover:underline">
                веб-кабинет
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom ribbon */}
        <div className="mt-8 space-y-4 border-t border-violet-400/20 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SCALES.map((name) => (
              <span
                key={name}
                className="shrink-0 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-50 shadow-[0_0_14px_rgba(139,92,246,0.25)]"
              >
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-center backdrop-blur-md sm:text-left"
              >
                <p className="text-lg font-black text-white sm:text-xl">{s.value}</p>
                <p className="text-[11px] font-medium text-violet-100/65">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] leading-relaxed text-violet-200/45 sm:text-left">
            Справочная информация (CDS). Не ставит диагноз; интерпретация — лечащий специалист.
          </p>
        </div>
      </div>
    </section>
  );
}
