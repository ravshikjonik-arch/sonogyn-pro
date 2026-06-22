"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FetalAnomalyRecord } from "@/lib/education/fetal-anatomy-22-views/types";

const SEVERITY_LABELS: Record<FetalAnomalyRecord["severity"], string> = {
  critical: "Critical",
  major: "Major",
  moderate: "Moderate",
  minor: "Minor",
};

type FetalAnatomyAnomalyCardProps = {
  anomaly: FetalAnomalyRecord;
  compact?: boolean;
  onSelect?: (id: string) => void;
  selected?: boolean;
};

export function FetalAnatomyAnomalyCard({
  anomaly,
  compact = false,
  onSelect,
  selected,
}: FetalAnatomyAnomalyCardProps) {
  return (
    <Card
      className={`border-[var(--clinical-border)] transition ${
        selected ? "ring-2 ring-[var(--clinical-primary)]" : ""
      } ${onSelect ? "cursor-pointer hover:border-[var(--clinical-primary)]/40" : ""}`}
      onClick={onSelect ? () => onSelect(anomaly.id) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(anomaly.id);
              }
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{anomaly.nameRu}</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {SEVERITY_LABELS[anomaly.severity]}
          </Badge>
        </div>
        <CardDescription>{anomaly.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{anomaly.definition}</p>
        {!compact ? (
          <>
            {anomaly.embryology ? (
              <Section title="Embryology" items={[anomaly.embryology]} />
            ) : null}
            <Section title="US findings" items={anomaly.ultrasoundFindings} />
            <Section title="Differential" items={anomaly.differentialDiagnosis} />
            <p className="text-xs">
              <strong>Prognosis:</strong> {anomaly.prognosis}
            </p>
            {anomaly.associatedSyndromes?.length ? (
              <Section title="Syndromes" items={anomaly.associatedSyndromes} />
            ) : null}
            <Section title="Follow-up" items={anomaly.recommendedFollowUp} />
          </>
        ) : (
          <>
            <Section title="US findings" items={anomaly.ultrasoundFindings.slice(0, 3)} />
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{anomaly.prognosis}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">{title}</p>
      <ul className="mt-0.5 list-disc pl-4 text-xs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
