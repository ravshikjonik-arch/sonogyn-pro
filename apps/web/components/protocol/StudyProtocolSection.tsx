"use client";

import { UltrasoundProtocolForm } from "@/components/protocol/UltrasoundProtocolForm";

type Props = {
  studyId: string;
  studyTitle: string;
  patientLabel: string;
  sessionSeed: string;
  physicianName?: string;
};

export function StudyProtocolSection(props: Props) {
  return (
    <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6 shadow-[var(--clinical-card-shadow)]">
      <h2 className="text-lg font-bold text-[var(--clinical-foreground)]">Протокол УЗИ / фетометрия</h2>
      <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
        Автоматический расчёт срока, EFW (Hadlock, Shepard, Warsof), AFI, перцентилей.
      </p>
      <div className="mt-6">
        <UltrasoundProtocolForm {...props} />
      </div>
    </section>
  );
}
