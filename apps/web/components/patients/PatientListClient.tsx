"use client";

import type { PatientRow } from "@repo/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PatientListClient() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const url = query ? `/api/patients?q=${encodeURIComponent(query)}` : "/api/patients";
      const res = await fetch(url);
      const json = (await res.json()) as { patients: PatientRow[] };
      setPatients(json.patients ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--clinical-foreground)]">Пациенты</h1>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
            Поиск по ФИО / метке. Данные хранятся в вашем Supabase-проекте.
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">Новый пациент</Link>
        </Button>
      </div>

      <Input
        className="mt-6 max-w-md text-base"
        placeholder="Поиск пациента…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {loading ? (
        <p className="mt-8 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>
      ) : patients.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[var(--clinical-border)] p-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
          Пациенты не найдены. Создайте первую карту.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--clinical-border)] rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition hover:bg-[var(--clinical-muted)]"
              >
                <span className="font-semibold">{p.display_label}</span>
                <span className="text-xs text-[var(--clinical-foreground-muted)]">
                  {new Date(p.updated_at).toLocaleDateString("ru-RU")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
