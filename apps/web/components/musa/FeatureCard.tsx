"use client";

import type { MusaEducationalFeatureCard } from "@repo/musa-framework";

import { Badge } from "@/components/ui/badge";
import { MusaCard } from "@/components/musa/MusaCard";

type FeatureCardProps = {
  feature: MusaEducationalFeatureCard;
  active?: boolean;
  onToggle?: () => void;
};

export function FeatureCard({ feature, active = false, onToggle }: FeatureCardProps) {
  return (
    <MusaCard
      title={feature.title}
      description={feature.musa_term}
      badge={feature.score_points > 0 ? `+${feature.score_points}` : undefined}
      className={active ? "ring-2 ring-[var(--clinical-primary)]" : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        className="mb-3 w-full rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-left text-sm transition hover:bg-[var(--clinical-muted)]"
      >
        {active ? "✓ Признак отмечен" : "Отметить признак"}
      </button>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">{feature.definition}</p>
      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium">УЗ-картина: </span>
          {feature.ultrasound_appearance}
        </p>
        <ul className="list-disc pl-5 text-[var(--clinical-foreground-muted)]">
          {feature.key_features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p>
          <span className="font-medium">Дифференциал: </span>
          {feature.differential_diagnosis.join("; ")}
        </p>
        <Badge variant="secondary">{feature.diagnostic_value}</Badge>
        {feature.pitfalls.length ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Pitfalls: {feature.pitfalls.join("; ")}
          </p>
        ) : null}
      </div>
    </MusaCard>
  );
}
