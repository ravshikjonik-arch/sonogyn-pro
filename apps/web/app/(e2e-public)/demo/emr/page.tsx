"use client";

import { useEffect, useState } from "react";

type ScheduleSlot = {
  id: string;
  time: string;
  patientName: string;
  complaint: string;
};

export default function EmrDemoPage() {
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [draft, setDraft] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/e2e/schedule?day=${day}`)
      .then((r) => r.json())
      .then((json: { slots?: ScheduleSlot[] }) => setSlots(json.slots ?? []));
  }, [day]);

  useEffect(() => {
    const saved = localStorage.getItem("e2e-draft");
    if (saved) setDraft(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("e2e-draft", draft);
  }, [draft]);

  async function saveAppointment() {
    try {
      const res = await fetch("/api/e2e/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints: draft, diagnosis }),
      });
      setAppointmentSaved(res.ok);
    } catch {
      setAppointmentSaved(false);
    }
  }

  async function savePrescription() {
    const res = await fetch("/api/e2e/prescriptions", { method: "POST" });
    setPrescriptionSaved(res.ok);
  }

  async function simulateConflict() {
    const res = await fetch("/api/e2e/patients/patient-seed-1/record", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "If-Match": "v1" },
      body: JSON.stringify({ diagnosis: "Конфликт A" }),
    });
    if (res.status === 409) setConflict("409");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10" data-testid="emr-demo-page">
      <header>
        <h1 className="text-2xl font-bold" data-testid="schedule-title">
          Расписание приёмов (E2E demo)
        </h1>
        <p className="text-sm text-slate-600">Мок-бэкенд для Playwright. В production скрыт.</p>
      </header>

      <section data-testid="schedule-section">
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="schedule-day-today"
            className={`rounded-lg px-3 py-1 text-sm ${day === "today" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
            onClick={() => setDay("today")}
          >
            Сегодня
          </button>
          <button
            type="button"
            data-testid="schedule-day-tomorrow"
            className={`rounded-lg px-3 py-1 text-sm ${day === "tomorrow" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
            onClick={() => setDay("tomorrow")}
          >
            Завтра
          </button>
        </div>
        <ul className="mt-4 space-y-2" data-testid="schedule-list">
          {slots.map((slot) => (
            <li
              key={slot.id}
              data-testid="schedule-slot"
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="font-semibold" data-testid="schedule-slot-time">
                {slot.time}
              </div>
              <div data-testid="schedule-slot-patient">{slot.patientName}</div>
              <div className="text-sm text-slate-600" data-testid="schedule-slot-complaint">
                {slot.complaint}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="appointment-section">
        <h2 className="text-lg font-semibold">Новый приём</h2>
        <textarea
          data-testid="appointment-complaints"
          className="mt-2 w-full rounded-lg border p-3"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Жалобы и анамнез"
        />
        <input
          data-testid="appointment-diagnosis"
          className="mt-2 w-full rounded-lg border p-3"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Диагноз"
        />
        <button
          type="button"
          data-testid="appointment-save"
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-white"
          onClick={() => void saveAppointment()}
        >
          Сохранить приём
        </button>
        {appointmentSaved ? (
          <p data-testid="appointment-saved-msg" className="mt-2 text-sm text-emerald-700">
            Приём сохранён и отображается в расписании (мок).
          </p>
        ) : null}
      </section>

      <section data-testid="prescription-section">
        <h2 className="text-lg font-semibold">Электронный рецепт</h2>
        <input data-testid="prescription-drug" className="mt-2 w-full rounded-lg border p-3" defaultValue="Дидrogesteron" />
        <input data-testid="prescription-dose" className="mt-2 w-full rounded-lg border p-3" defaultValue="10 мг" />
        <button
          type="button"
          data-testid="prescription-save"
          className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-white"
          onClick={() => void savePrescription()}
        >
          Выписать рецепт
        </button>
        {prescriptionSaved ? (
          <p data-testid="prescription-saved-msg" className="mt-2 text-sm text-violet-700">
            Рецепт сохранён (мок).
          </p>
        ) : null}
      </section>

      <section data-testid="critical-section">
        <button
          type="button"
          data-testid="conflict-simulate"
          className="rounded-lg border px-4 py-2"
          onClick={() => void simulateConflict()}
        >
          Симулировать конфликт редактирования
        </button>
        {conflict ? (
          <p data-testid="conflict-message" className="mt-2 text-sm text-amber-700">
            Конфликт данных: другой врач изменил карту (409).
          </p>
        ) : null}
      </section>
    </main>
  );
}
