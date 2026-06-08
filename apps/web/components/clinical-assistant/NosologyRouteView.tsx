"use client";

import {
  AlertTriangle,
  ClipboardList,
  FlaskConical,
  Printer,
  Scan,
  Stethoscope,
  Syringe,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";

import { AssistantProtocolSavePanel } from "@/components/clinical-assistant/AssistantProtocolSavePanel";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { BasicCourseLinkPanel } from "@/components/education/BasicCourseLinkPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildAssistantProtocolText } from "@/lib/clinical-assistant/build-protocol";
import type { ObgynNosologyCard } from "@/lib/clinical-assistant";
import { FMF_EARLY_ASSISTANT_HREF, isEarlyPregnancyAssistantCode } from "@/lib/clinical-assistant/early-pregnancy";
import { nosologyAssistContextFromCard } from "@/lib/clinical-assistant/nosology-assist-context";
import { cn } from "@/lib/utils/cn";

function BulletList({ items, empty }: { items: string[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--clinical-foreground-muted)]">{empty ?? "В документе для этой МКБ блок не заполнен."}</p>;
  }
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-[var(--clinical-foreground)]">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clinical-primary)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type RouteStep = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count: (card: ObgynNosologyCard) => number;
  render: (card: ObgynNosologyCard) => ReactNode;
};

function buildSteps(card: ObgynNosologyCard): RouteStep[] {
  const steps: RouteStep[] = [
    {
      id: "visit",
      label: "Приём",
      icon: Stethoscope,
      count: (c) => c.visitChecklist.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Что спросить на приёме</h3>
          <BulletList items={c.visitChecklist} />
        </>
      ),
    },
    {
      id: "labs",
      label: "Анализы",
      icon: FlaskConical,
      count: (c) => c.laboratoryWorkup.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Лабораторные анализы</h3>
          <BulletList items={c.laboratoryWorkup} />
        </>
      ),
    },
    {
      id: "instrumental",
      label: "Инструментально",
      icon: Scan,
      count: (c) => c.instrumentalInvestigations.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Инструментальные исследования</h3>
          <BulletList items={c.instrumentalInvestigations} />
        </>
      ),
    },
    {
      id: "us",
      label: "УЗИ",
      icon: Waves,
      count: (c) => c.ultrasoundFocus.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">УЗИ — что зафиксировать</h3>
          <BulletList items={c.ultrasoundFocus} />
        </>
      ),
    },
    {
      id: "dx",
      label: "Диагностика",
      icon: ClipboardList,
      count: (c) => c.diagnostics.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Дифференциальная диагностика</h3>
          <BulletList items={c.diagnostics} />
        </>
      ),
    },
    {
      id: "tx",
      label: "Лечение",
      icon: Syringe,
      count: (c) => c.treatmentRoute.length,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Лечение и тактика</h3>
          <BulletList items={c.treatmentRoute} />
        </>
      ),
    },
    {
      id: "flags",
      label: "Флаги",
      icon: AlertTriangle,
      count: (c) => c.redFlags.length,
      render: (c) => (
        <>
          <h3 className={cn("mb-3 text-sm font-bold", "text-red-700 dark:text-red-300")}>Красные флаги</h3>
          <BulletList items={c.redFlags} />
        </>
      ),
    },
    {
      id: "protocol",
      label: "Протокол",
      icon: ClipboardList,
      count: (c) => c.protocolTemplate.length + c.routing.length,
      render: (c) => (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Структура протокола</h3>
            <BulletList items={c.protocolTemplate} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Маршрутизация</h3>
            <BulletList items={c.routing} />
          </div>
        </div>
      ),
    },
  ];

  if (card.specialistConsultations?.length) {
    steps.push({
      id: "consult",
      label: "Консультации",
      icon: Stethoscope,
      count: (c) => c.specialistConsultations?.length ?? 0,
      render: (c) => (
        <>
          <h3 className="mb-3 text-sm font-bold text-[var(--clinical-primary-deep)]">Консультации специалистов</h3>
          <BulletList items={c.specialistConsultations ?? []} />
        </>
      ),
    });
  }

  if (card.notRecommended?.length) {
    steps.push({
      id: "avoid",
      label: "Не рекомендуем",
      icon: AlertTriangle,
      count: (c) => c.notRecommended?.length ?? 0,
      render: (c) => (
        <>
                <h3 className="mb-3 text-sm font-bold text-amber-800">Не рекомендуем</h3>
          <BulletList items={c.notRecommended ?? []} />
        </>
      ),
    });
  }

  return steps;
}

type Props = {
  card: ObgynNosologyCard;
  initialPatientId?: string;
  backHref: string;
  compact?: boolean;
};

export function NosologyRouteView({ card, initialPatientId, backHref, compact }: Props) {
  const assistContext = useMemo(() => nosologyAssistContextFromCard(card), [card]);
  const steps = useMemo(() => buildSteps(card), [card]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeStep, setActiveStep] = useState(steps[0]?.id ?? "visit");

  const scrollToStep = useCallback((id: string) => {
    setActiveStep(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const printRoute = useCallback(() => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${card.title}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;max-width:800px;line-height:1.45}
h1{font-size:18px}h2{font-size:14px;margin-top:18px;color:#334155}ul{padding-left:18px}</style></head><body>
<h1>${card.code} — ${card.title}</h1>
<p>${card.dailyUse}</p>
<h2>Лабораторные анализы</h2><ul>${card.laboratoryWorkup.map((x) => `<li>${x}</li>`).join("")}</ul>
<h2>Инструментально</h2><ul>${card.instrumentalInvestigations.map((x) => `<li>${x}</li>`).join("")}</ul>
<h2>УЗИ</h2><ul>${card.ultrasoundFocus.map((x) => `<li>${x}</li>`).join("")}</ul>
<h2>Лечение</h2><ul>${card.treatmentRoute.map((x) => `<li>${x}</li>`).join("")}</ul>
<p style="font-size:11px;color:#64748b">Не является диагнозом. Решение принимает лечащий врач.</p>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }, [card]);

  const copyProtocol = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildAssistantProtocolText(card));
      toast.success("Протокол скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [card]);

  const isIndex = card.depth === "index";

  return (
    <div className={cn("space-y-6", compact ? "px-1" : "mx-auto max-w-4xl px-4 py-8 lg:px-8")}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>← К списку заболеваний</Link>
        </Button>
        {!compact ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/workspace">AI-зона УЗИ</Link>
          </Button>
        ) : null}
      </div>

      <header className="sonogyn-glass-card space-y-3 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="font-black">{card.code}</Badge>
          <Badge variant="outline">{card.group}</Badge>
          {isIndex ? (
            <Badge variant="outline" className="border-amber-400 text-amber-800">
              Базовый маршрут
            </Badge>
          ) : (
              <Badge className="bg-emerald-600">Полный маршрут · помощник врача-гинеколога</Badge>
          )}
        </div>
        <h1 className="text-xl font-black leading-tight sm:text-2xl">{card.title}</h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{card.dailyUse}</p>
        {isIndex ? (
          <p className="rounded-xl border border-amber-300/50 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Для этой МКБ — базовая структура. Полные маршруты: СПКЯ E28.2, миома D25, эндометриоз N80 и др. (зелёная
            метка «Полный» в списке).
          </p>
        ) : null}
      </header>

      <ClinicalAssistStrip context={assistContext} compact={compact} />

      {isEarlyPregnancyAssistantCode(card.code, card.group) ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
            <div>
              <p className="text-sm font-bold text-teal-950 dark:text-teal-100">FMF · малый срок</p>
              <p className="mt-1 text-xs leading-relaxed text-teal-900/80 dark:text-teal-100/80">
                Для ранней беременности используйте пошаговый модуль УЗИ до 11 нед.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href={FMF_EARLY_ASSISTANT_HREF}>Открыть FMF →</Link>
            </Button>
          </div>
          <BasicCourseLinkPanel variant="inline" />
        </div>
      ) : null}

      <nav
        className="sticky top-0 z-20 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/95 p-1.5 shadow-sm backdrop-blur-md"
        aria-label="Шаги клинического маршрута"
      >
        {steps.map((step) => {
          const Icon = step.icon;
          const n = step.count(card);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => scrollToStep(step.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm",
                activeStep === step.id
                  ? "bg-[var(--clinical-primary)] text-white shadow-sm"
                  : "text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {step.label}
              {n > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    activeStep === step.id ? "bg-white/25" : "bg-[var(--clinical-muted)]",
                  )}
                >
                  {n}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-8">
        {steps.map((step) => (
          <section
            key={step.id}
            id={`route-${step.id}`}
            ref={(el) => {
              sectionRefs.current[step.id] = el;
            }}
            className="scroll-mt-24 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 shadow-sm"
          >
            {step.render(card)}
          </section>
        ))}
      </div>

      <p className="rounded-lg bg-[var(--clinical-muted)] p-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        <span className="font-bold">Источник: </span>
        {card.sourceNote}
      </p>
      <p className="text-center text-[10px] text-[var(--clinical-foreground-muted)]">
        Не является диагнозом. Интерпретация и решение — лечащий врач.
      </p>

      <div className="space-y-4 border-t border-[var(--clinical-border)] pt-6">
        <AssistantProtocolSavePanel card={card} initialPatientId={initialPatientId} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-2" onClick={() => void copyProtocol()}>
            <ClipboardList className="h-4 w-4" />
            Копировать протокол
          </Button>
          <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={printRoute}>
            <Printer className="h-4 w-4" />
            Печать маршрута
          </Button>
        </div>
      </div>
    </div>
  );
}
