"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STUDY_OPTIONS = [
  { value: "ob_gyn_general", label: "OB/GYN общее" },
  { value: "ob_fetal", label: "Акушерство · плод" },
  { value: "ob_doppler", label: "Акушерство · допплер" },
  { value: "gyn_pelvic", label: "Гинекология · ТМТ" },
  { value: "gyn_ovarian", label: "Гинекология · яичники" },
  { value: "cervix", label: "Шейка матки" },
  { value: "placenta", label: "Плацента / предлежание" },
  { value: "iugr_workup", label: "ФРП / рост" },
  { value: "other", label: "Другое" },
];

export function CreateStudyForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [studyType, setStudyType] = useState("ob_gyn_general");
  const [patientLabel, setPatientLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/copilot/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          studyType,
          patientDisplayLabel: patientLabel.trim() || null,
        }),
      });

      const payload = (await response.json()) as {
        study?: { id: string };
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Не удалось создать исследование");
        return;
      }

      if (payload.study?.id) {
        router.push(`/workspace/${payload.study.id}`);
        router.refresh();
      }
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Название исследования
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 focus:ring-2"
          placeholder="Например: контроль ФРП 30 нед."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Тип исследования
        </label>
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 focus:ring-2"
          value={studyType}
          onChange={(e) => setStudyType(e.target.value)}
        >
          {STUDY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Условная метка случая (без PHI)
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 focus:ring-2"
          placeholder="Пациентка А / внутренний номер клиники"
          value={patientLabel}
          onChange={(e) => setPatientLabel(e.target.value)}
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Создание..." : "Создать исследование"}
      </button>
    </form>
  );
}
