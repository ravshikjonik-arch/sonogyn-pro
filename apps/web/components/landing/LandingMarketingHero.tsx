import Image from "next/image";
import {
  BookOpen,
  Calculator,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { LandingAuthCard } from "@/components/landing/LandingAuthCard";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-ассистент",
    text: "Умный анализ и поддержка клинических решений",
  },
  {
    icon: MessageSquare,
    title: "Чат врачей",
    text: "Профессиональное сообщество и обсуждение кейсов",
  },
  {
    icon: Calculator,
    title: "Калькуляторы и шкалы",
    text: "O-RADS, BI-RADS, TI-RADS, IOTA, FMF и другие инструменты",
  },
  {
    icon: BookOpen,
    title: "Обучение и гайды",
    text: "Курсы, атласы и клинические рекомендации",
  },
  {
    icon: Lock,
    title: "Безопасность",
    text: "Защита данных и доступ только для специалистов",
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
  { value: "AI + чат", label: "ассистент и коллеги" },
] as const;

const HERO_ART = "/marketing/sonogyn-universe-hero.png";

type Props = {
  isAuthenticated: boolean;
};

export function LandingMarketingHero({ isAuthenticated }: Props) {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#05030a] text-white"
      aria-labelledby="landing-marketing-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(124,58,237,0.35),transparent_55%),radial-gradient(ellipse_at_80%_10%,rgba(168,85,247,0.22),transparent_45%),radial-gradient(ellipse_at_70%_80%,rgba(91,33,182,0.25),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-8">
          {/* Left copy — order 2 on mobile after auth */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-3 lg:pt-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black shadow-[0_0_24px_rgba(168,85,247,0.55)]">
                S
              </span>
              <div>
                <p className="text-sm font-black tracking-tight">SonoGyn Pro</p>
                <p className="text-[11px] font-semibold text-violet-300/80">Клиническая платформа</p>
              </div>
            </div>

            <h1
              id="landing-marketing-heading"
              className="hidden text-[1.65rem] font-black leading-[1.12] tracking-tight sm:text-3xl lg:block xl:text-[2rem]"
            >
              Ваша вселенная женского здоровья
            </h1>
            <p className="text-sm leading-relaxed text-violet-100/75 sm:text-[15px]">
              Всё, что нужно врачу — в одной платформе с искусственным интеллектом
            </p>

            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/15 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.35)]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="text-xs leading-snug text-violet-100/60">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Center creative */}
          <div className="relative order-3 lg:order-2 lg:col-span-5">
            <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-2xl border border-violet-400/25 bg-black/40 shadow-[0_0_60px_rgba(124,58,237,0.35)] sm:aspect-[16/11] lg:max-w-none">
              <Image
                src={HERO_ART}
                alt="SonoGyn Pro — кабинет врача, мобильный ассистент и клинические инструменты"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#05030a]/80 via-transparent to-[#05030a]/20"
                aria-hidden
              />
            </div>
            <p className="mt-3 text-center text-[11px] text-violet-200/45 lg:text-left">
              Макет интерфейса · реальный продукт доступен после входа
            </p>
          </div>

          {/* Auth first on mobile for conversion */}
          <div className="order-1 space-y-4 lg:order-3 lg:col-span-4">
            <div className="lg:hidden">
              <h1 className="text-2xl font-black leading-tight tracking-tight">
                Ваша вселенная женского здоровья
              </h1>
              <p className="mt-2 text-sm text-violet-100/75">
                Всё, что нужно врачу — в одной платформе с ИИ
              </p>
            </div>
            <LandingAuthCard />
            {!isAuthenticated ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-violet-300">3D-анатомия</p>
                  <p className="mt-1 text-sm font-semibold text-white">Интерактивные модели и FIGO</p>
                  <p className="mt-1 text-xs text-violet-100/55">Атласы и визуализация для приёма и обучения</p>
                </aside>
                <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-violet-300">Evidence</p>
                  <p className="mt-1 text-sm font-semibold text-white">Доказательная база</p>
                  <p className="mt-1 text-xs text-violet-100/55">КР, PubMed и гайдлайны — рядом с калькулятором</p>
                </aside>
              </div>
            ) : null}
          </div>
        </div>

        {/* Ribbon */}
        <div className="mt-10 space-y-5 border-t border-violet-500/20 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {SCALES.map((name) => (
              <span
                key={name}
                className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-100"
              >
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center sm:text-left"
              >
                <p className="text-lg font-black text-white sm:text-xl">{s.value}</p>
                <p className="text-[11px] font-medium text-violet-100/60">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] leading-relaxed text-violet-200/40 sm:text-left">
            Справочная информация (CDS). Не ставит диагноз; интерпретация — лечащий специалист.
          </p>
        </div>
      </div>
    </section>
  );
}
