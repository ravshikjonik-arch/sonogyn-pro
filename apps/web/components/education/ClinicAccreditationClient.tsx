"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ACCREDITATION_CATEGORY_LABELS,
  ACCREDITATION_SECTIONS,
  CLINIC_ACCREDITATION_DISCLAIMER,
  CLINIC_ACCREDITATION_LINKS,
  itemsByCategory,
  loadSectionProgress,
  resetSectionProgress,
  sectionCompleteness,
  setAccreditationItemDone,
} from "@/lib/education/clinic-accreditation";

export function ClinicAccreditationClient() {
  const [activeSectionId, setActiveSectionId] = useState(ACCREDITATION_SECTIONS[0]!.id);
  const [tick, setTick] = useState(0);

  const activeSection = ACCREDITATION_SECTIONS.find((s) => s.id === activeSectionId)!;
  const progress = useMemo(() => loadSectionProgress(activeSectionId), [activeSectionId, tick]);
  const completeness = useMemo(
    () => sectionCompleteness(activeSection, progress),
    [activeSection, progress],
  );
  const grouped = useMemo(() => itemsByCategory(activeSection), [activeSection]);
  const percent = Math.round((completeness.requiredDone / Math.max(1, completeness.requiredTotal)) * 100);

  const toggle = useCallback(
    (itemId: string) => {
      setAccreditationItemDone(activeSectionId, itemId, !progress[itemId]);
      setTick((n) => n + 1);
    },
    [activeSectionId, progress],
  );

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("sonogyn:clinic-accreditation-progress", refresh);
    return () => window.removeEventListener("sonogyn:clinic-accreditation-progress", refresh);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ACCREDITATION_SECTIONS.map((section) => (
          <Button
            key={section.id}
            variant={section.id === activeSectionId ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSectionId(section.id)}
          >
            {section.titleRu}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-5 w-5 text-[var(--clinical-primary)]" />
                {activeSection.titleRu}
              </CardTitle>
              <CardDescription>{activeSection.subtitle}</CardDescription>
              <Badge variant="outline">{activeSection.source}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { resetSectionProgress(activeSectionId); setTick((n) => n + 1); }}>
              <RotateCcw className="mr-1 h-4 w-4" /> Сброс
            </Button>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm">
              Обязательные: {completeness.requiredDone}/{completeness.requiredTotal} · Всего: {completeness.done}/
              {completeness.total}
            </p>
            <Progress value={percent} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...grouped.entries()].map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold">{ACCREDITATION_CATEGORY_LABELS[category]}</h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--clinical-muted)]"
                    >
                      {progress[item.id] ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" />
                      )}
                      <span>
                        {item.label}
                        {!item.required && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            опционально
                          </Badge>
                        )}
                        {item.hint ? (
                          <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">{item.hint}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">{CLINIC_ACCREDITATION_DISCLAIMER}</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={CLINIC_ACCREDITATION_LINKS.cme.href} className="text-[var(--clinical-primary)] underline">
          {CLINIC_ACCREDITATION_LINKS.cme.label}
        </Link>
        <Link href={CLINIC_ACCREDITATION_LINKS.safety.href} className="text-[var(--clinical-primary)] underline">
          {CLINIC_ACCREDITATION_LINKS.safety.label}
        </Link>
        <Link href={CLINIC_ACCREDITATION_LINKS.checklists.href} className="text-[var(--clinical-primary)] underline">
          {CLINIC_ACCREDITATION_LINKS.checklists.label}
        </Link>
      </div>
    </div>
  );
}
