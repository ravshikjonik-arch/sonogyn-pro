"use client";

import Image from "next/image";
import Link from "next/link";

import {
  IOTA_BENIGN_DESCRIPTORS,
  IOTA_MALIGNANT_DESCRIPTORS,
  ORADS_US_VERSION,
  SUPPLEMENTARY_READING,
  getAdnexPage,
  type AdnexTriangulation,
} from "@repo/adnex-education";

import { cn } from "@/lib/utils/cn";

const AGREEMENT_STYLES = {
  full: { label: "Согласовано", className: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  partial: { label: "Уточнить", className: "bg-amber-100 text-amber-900 border-amber-300" },
  conflict: { label: "Расхождение", className: "bg-rose-100 text-rose-900 border-rose-300" },
} as const;

const VERDICT_RU = {
  benign: "доброкачественное",
  malignant: "подозрение на ЗНО",
  indeterminate: "неопределённо",
} as const;

function descriptorLabel(code: string, kind: "benign" | "malignant") {
  const list = kind === "benign" ? IOTA_BENIGN_DESCRIPTORS : IOTA_MALIGNANT_DESCRIPTORS;
  const d = list.find((x) => x.code === code);
  return d ? `${code}: ${d.labelRu}` : code;
}

type Props = {
  triangulation: AdnexTriangulation;
  disabled?: boolean;
};

export function AdnexConsensusPanel({ triangulation: tri, disabled }: Props) {
  const agreement = AGREEMENT_STYLES[tri.agreement];
  const pitfalls = tri.pitfalls ?? tri.guardrails;
  const atlasPitfall = pitfalls.find((g) => g.atlasPageId);
  const atlasPage = atlasPitfall?.atlasPageId ? getAdnexPage(atlasPitfall.atlasPageId) : undefined;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-slate-50/50 shadow-sm",
        disabled && "opacity-60",
      )}
    >
      <div className="border-b border-sky-100 bg-sky-900/90 px-4 py-3 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-200">
              {ORADS_US_VERSION} · ACR / IOTA
            </p>
            <p className="text-sm font-bold">O-RADS US × IOTA Simple Rules</p>
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-black", agreement.className)}>
            {agreement.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-sky-100">{tri.headline}</p>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--clinical-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">O-RADS US</p>
          <p className="mt-1 text-3xl font-black text-[var(--clinical-primary-deep)]">{tri.oradsCategory}</p>
          {tri.suggestedOradsNote ? (
            <p className="mt-2 text-xs font-semibold text-amber-800">{tri.suggestedOradsNote}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--clinical-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">IOTA Simple Rules</p>
          <p className="mt-1 text-sm font-bold capitalize text-violet-900">{VERDICT_RU[tri.iotaVerdict]}</p>
          {tri.iotaBenign.length ? (
            <ul className="mt-2 space-y-0.5 text-[11px] text-emerald-800">
              {tri.iotaBenign.map((c) => (
                <li key={c}>{descriptorLabel(c, "benign")}</li>
              ))}
            </ul>
          ) : null}
          {tri.iotaMalignant.length ? (
            <ul className="mt-1 space-y-0.5 text-[11px] text-rose-800">
              {tri.iotaMalignant.map((c) => (
                <li key={c}>{descriptorLabel(c, "malignant")}</li>
              ))}
            </ul>
          ) : null}
          {!tri.iotaBenign.length && !tri.iotaMalignant.length ? (
            <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">Заполните структуру и признаки выше.</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--clinical-border)] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Тактика O-RADS US</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground)]">{tri.managementRu}</p>
        </div>
      </div>

      {pitfalls.length ? (
        <div className="space-y-2 border-t border-sky-100 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-sky-800">
            Уточнения по протоколу O-RADS US
          </p>
          {pitfalls.map((g) => (
            <div
              key={g.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                g.severity === "critical" && "border-rose-300 bg-rose-50",
                g.severity === "warning" && "border-amber-300 bg-amber-50",
                g.severity === "info" && "border-slate-200 bg-slate-50",
              )}
            >
              <p className="font-bold">{g.title}</p>
              <p className="mt-0.5 text-[var(--clinical-foreground-muted)]">{g.message}</p>
              {g.atlasHref ? (
                <Link
                  href={g.atlasHref}
                  className="mt-1 inline-block font-semibold text-[var(--clinical-primary-deep)] hover:underline"
                >
                  Эхограммы в библиотеке →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {atlasPage ? (
        <div className="flex gap-3 border-t border-sky-100 bg-white/60 p-4">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-[var(--clinical-border)]">
            <Image
              src={atlasPage.image_href}
              alt={`Эхограмма, стр. ${atlasPage.page_number}`}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-bold text-[var(--clinical-primary-deep)]">Иллюстрация · стр. {atlasPage.page_number}</p>
            <p className="mt-1 line-clamp-3 text-[var(--clinical-foreground-muted)]">
              {atlasPage.teaching_hint ?? atlasPage.title ?? atlasPage.ocr_text.slice(0, 180)}
            </p>
            {atlasPitfall?.atlasHref ? (
              <Link
                href={atlasPitfall.atlasHref}
                className="mt-1 inline-block font-semibold text-[var(--clinical-primary-deep)] hover:underline"
              >
                Открыть в библиотеке →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-sky-100 bg-slate-50/80 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Черновик протокола</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground)]">{tri.protocolSnippet}</p>
      </div>

      <div className="border-t border-slate-200 bg-slate-100/80 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Дополнительная литература</p>
        <ul className="mt-2 space-y-2 text-xs text-[var(--clinical-foreground-muted)]">
          {SUPPLEMENTARY_READING.map((r) => (
            <li key={r.id}>
              <span className="text-[var(--clinical-foreground)]">{r.citation}</span>
              <span className="block mt-0.5">{r.note}</span>
              {r.href ? (
                <Link href={r.href} className="mt-1 inline-block font-semibold text-[var(--clinical-primary-deep)] hover:underline">
                  Читать с эхограммами →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
