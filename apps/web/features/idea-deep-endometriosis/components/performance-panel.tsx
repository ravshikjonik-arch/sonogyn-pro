"use client";

import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import { t } from "../lib/messages";

export type PerformancePanelProps = {
  className?: string;
  testId?: string;
};

/**
 * Справочная панель по литературе; не отражает точность на конкретного пациента.
 */
export function PerformancePanel({ className, testId }: PerformancePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={cn("border-[var(--clinical-border)]", className)} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{t("panel.evidence")}</CardTitle>
        <Button type="button" variant="ghost" size="sm" className="h-9 gap-1" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4 rotate-180" />}
          {open ? "Скрыть" : "Показать"}
        </Button>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          <p>
            Трансвагинальное УЗИ при подозрении на глубокий эндометриоз: в отдельных когортах сообщалась чувствительность
            до <strong className="text-slate-900 dark:text-slate-100">94%</strong> и специфичность до{" "}
            <strong className="text-slate-900 dark:text-slate-100">95%</strong> (Guerriero S et al., 2018 — ориентир;
            сверяйтесь с клиническими рекомендациями МЗ РФ / профильными протоколами вашей организации).
          </p>
          <p>
            ПВП / НВП зависят от распространённости заболевания и опыта исследователя; блок носит исключительно
            образовательный характер.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              className="inline-flex items-center gap-1 font-semibold text-[var(--clinical-primary-deep)] hover:underline"
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noreferrer"
            >
              PubMed: IDEA / deep endometriosis <ExternalLink className="h-3 w-3" />
            </a>
            <a
              className="inline-flex items-center gap-1 font-semibold text-[var(--clinical-primary-deep)] hover:underline"
              href="https://www.isuog.org/"
              target="_blank"
              rel="noreferrer"
            >
              ISUOG — материалы <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
