import Image from "next/image";
import {
  BookOpen,
  Calculator,
  Lock,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { TrackCtaLink } from "@/components/analytics/TrackCtaLink";
import { BrandMark } from "@/components/brand/BrandMark";
import { OpenAccessEntryCard } from "@/components/landing/OpenAccessEntryCard";
import { Button } from "@/components/ui/button";

const TOP_PILLS = [
  { icon: Calculator, label: "Калькуляторы" },
  { icon: ShieldCheck, label: "По гайдлайнам" },
  { icon: MessageSquare, label: "Чат врачей" },
  { icon: BookOpen, label: "Обучение" },
] as const;

const FEATURES = [
  {
    icon: Calculator,
    title: "Калькуляторы и классификации",
    text: "O-RADS, BI-RADS, TI-RADS, IOTA, FIGO, FMF — по актуальным гайдлайнам",
  },
  {
    icon: Stethoscope,
    title: "CDS-ассистент",
    text: "Структурированные подсказки. Не диагноз — решение за врачом",
  },
  {
    icon: MessageSquare,
    title: "Кейсы и чат коллег",
    text: "Обсуждение снимков и рабочих вопросов между врачами",
  },
  {
    icon: BookOpen,
    title: "Обучение и справочники",
    text: "Курсы, атласы и клинические рекомендации в одном кабинете",
  },
  {
    icon: Lock,
    title: "Только для специалистов",
    text: "Доступ для врачей; без ПДн пациентов в чатах и кейсах",
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
  { value: "ACR·FIGO", label: "классификации по гайдлайнам" },
  { value: "КР", label: "каталог рекомендаций МЗ РФ" },
  { value: "CDS", label: "справочно · решение за врачом" },
] as const;

/** WebP ~54% smaller than PNG; Next/Image serves with modern formats. */
const HERO_ART = "/marketing/sonogyn-universe-hero.webp";

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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(124,58,237,0.14),transparent_55%)]"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24 lg:px-8 lg:pt-28">
        {/* Top brand strip */}
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <BrandMark className="h-11 w-11 rounded-xl ring-1 ring-white/20" />
            <div>
              <p className="text-base font-black tracking-tight">SonoGyn Pro</p>
              <p className="mt-0.5 max-w-md text-[10px] font-bold uppercase leading-snug tracking-[0.06em] text-violet-200/75 sm:text-[11px]">
                Рабочая платформа для акушеров-гинекологов и врачей УЗИ
              </p>
            </div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {TOP_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-black/35 px-3 py-1.5 text-[11px] font-bold text-violet-50 backdrop-blur-md"
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
            <div className="rounded-2xl border border-violet-300/20 bg-black/45 p-5 shadow-xl backdrop-blur-xl sm:p-6">
              <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-violet-300">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                Для врача, не для пациента
              </p>
              <h1
                id="landing-marketing-heading"
                className="text-[1.75rem] font-black uppercase leading-[1.08] tracking-tight sm:text-3xl xl:text-[2.05rem]"
              >
                Кабинет УЗИ и АГ по гайдлайнам
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-violet-50/80 sm:text-[15px]">
                Калькуляторы, классификации и CDS в одном месте — интерпретация остаётся за вами
              </p>

              <ul className="mt-5 space-y-3">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/20 text-violet-100">
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
            {isAuthenticated ? (
              <div className="rounded-3xl border border-white/15 bg-black/45 p-5 text-white shadow-xl backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/80">Сессия активна</p>
                <h2 className="mt-2 text-xl font-black tracking-tight">С возвращением</h2>
                <Button asChild size="lg" className="mt-5 w-full bg-white font-semibold text-violet-900 hover:bg-white/95">
                  <TrackCtaLink href="/app" cta="cabinet" placement="landing_hero">
                    В личный кабинет
                  </TrackCtaLink>
                </Button>
              </div>
            ) : (
              <OpenAccessEntryCard className="shadow-xl" />
            )}
          </div>
        </div>

        {/* Bottom ribbon */}
        <div className="mt-8 space-y-4 border-t border-violet-400/20 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SCALES.map((name) => (
              <span
                key={name}
                className="shrink-0 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-50"
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
