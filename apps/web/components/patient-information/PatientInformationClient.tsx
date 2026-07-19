"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";

import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildPatientLeafletSpec,
  PATIENT_INFO_DISCLAIMER,
  PATIENT_LEAFLETS,
  type PatientLeafletId,
} from "@/lib/patient-information";

export function PatientInformationClient() {
  const [activeId, setActiveId] = useState<PatientLeafletId>(PATIENT_LEAFLETS[0]!.id);

  const active = PATIENT_LEAFLETS.find((l) => l.id === activeId)!;
  const spec = useMemo(() => buildPatientLeafletSpec(active), [active]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        {PATIENT_LEAFLETS.map((leaflet) => (
          <button
            key={leaflet.id}
            type="button"
            onClick={() => setActiveId(leaflet.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
              leaflet.id === activeId
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10"
                : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]"
            }`}
          >
            <span className="font-medium">{leaflet.titleRu}</span>
            <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">{leaflet.subtitle}</span>
          </button>
        ))}
      </aside>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--clinical-primary)]" />
                {active.titleRu}
              </CardTitle>
              <CardDescription>{active.subtitle}</CardDescription>
              <Badge variant="outline">{active.source}</Badge>
            </div>
            {active.relatedHref && (
              <Link href={active.relatedHref} className="text-sm font-medium text-[var(--clinical-primary)] underline">
                {active.relatedLabel}
              </Link>
            )}
          </div>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            <strong>Когда использовать:</strong> {active.whenToUse}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {active.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-1 text-sm font-semibold">{section.heading}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                {section.body}
              </p>
            </div>
          ))}
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{PATIENT_INFO_DISCLAIMER}</p>
          <DocumentExportToolbar spec={spec} />
        </CardContent>
      </Card>
    </div>
  );
}
