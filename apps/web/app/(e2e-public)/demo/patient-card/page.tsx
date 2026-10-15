"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import testData from "@/lib/e2e/fixtures/test-data.json";

function PatientCardInner() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id") ?? "patient-seed-1";
  const [notes, setNotes] = useState(testData.patient.notes);
  const [diagnosis, setDiagnosis] = useState(testData.patient.diagnosis);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch(`/api/patients/${patientId}`)
      .then((r) => r.json())
      .then((json: { patient?: { meta?: { notes?: string; diagnosis?: string } } }) => {
        if (json.patient?.meta?.notes) setNotes(json.patient.meta.notes);
        if (json.patient?.meta?.diagnosis) setDiagnosis(json.patient.meta.diagnosis);
      })
      .catch(() => undefined);
  }, [patientId]);

  async function save() {
    const res = await fetch(`/api/e2e/patients/${patientId}/record`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, diagnosis }),
    });
    setSaved(res.ok);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10" data-testid="patient-card">
      <h1 className="text-2xl font-bold" data-testid="patient-card-name">
        {testData.patient.displayLabel}
      </h1>
      <p className="mt-1 text-sm text-slate-600" data-testid="patient-card-ref">
        № {testData.patient.externalRef}
      </p>

      <label className="mt-6 block text-sm font-medium">
        История болезни / заметки
        <textarea
          data-testid="patient-history-notes"
          className="mt-2 w-full rounded-lg border p-3"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Диагноз
        <input
          data-testid="patient-diagnosis"
          className="mt-2 w-full rounded-lg border p-3"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </label>

      <button
        type="button"
        data-testid="patient-save"
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        onClick={() => void save()}
      >
        Сохранить карту
      </button>

      {saved ? (
        <p data-testid="patient-saved-msg" className="mt-3 text-sm text-emerald-700">
          Карта сохранена (мок E2E).
        </p>
      ) : null}

      <p className="mt-8 text-xs text-slate-500">
        Демо-страница для Playwright. Не содержит реальных PHI — только фикстуры.
      </p>
    </main>
  );
}

export default function PatientCardDemoPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm">Загрузка карты…</p>}>
      <PatientCardInner />
    </Suspense>
  );
}
