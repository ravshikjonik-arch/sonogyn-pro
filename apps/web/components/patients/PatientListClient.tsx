"use client";

import type { PatientRow } from "@repo/types";
import { ChevronRight, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PatientAvatar } from "@/components/patients/PatientAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { ageFromDob, gestationFromLmp } from "@/lib/patients/insights";

const e2eFixtures = process.env.NEXT_PUBLIC_E2E_FIXTURES === "true";

type ListResponse = {
  patients: PatientRow[];
  nextCursor: string | null;
  hasMore: boolean;
};

function patientChips(meta: PatientRow["meta"]): string[] {
  const chips: string[] = [];
  const age = ageFromDob(meta?.date_of_birth);
  if (age !== null) chips.push(`${age} лет`);
  const gest = gestationFromLmp(meta?.lmp);
  if (gest) chips.push(`беременность ≈ ${gest.weeks} нед`);
  return chips;
}

export function PatientListClient() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (query: string, cursor?: string | null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "50");
      const res = await fetch(`/api/patients?${params.toString()}`);
      const json = (await res.json()) as ListResponse;
      setPatients((prev) => (append ? [...prev, ...(json.patients ?? [])] : (json.patients ?? [])));
      setNextCursor(json.nextCursor ?? null);
      setHasMore(Boolean(json.hasMore));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" data-testid="patients-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">Пациенты</h1>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
            Поиск по ФИО / метке. Данные — в вашем Supabase-проекте.
          </p>
        </div>
        <Button asChild className="sonogyn-cta-glow gap-2">
          <Link href="/patients/new">
            <UserPlus className="h-4 w-4" />
            Новый пациент
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex max-w-md items-center gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-2.5 focus-within:ring-2 focus-within:ring-[var(--clinical-ring)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" />
        <input
          className="flex-1 bg-transparent text-base text-[var(--clinical-foreground)] outline-none placeholder:text-[var(--clinical-foreground-muted)]"
          placeholder="Поиск пациента…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          data-testid="patient-search"
        />
      </div>

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--clinical-border)] p-10 text-center">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Пациенты не найдены. Создайте первую карту.</p>
          <Button asChild className="mt-4 gap-2">
            <Link href="/patients/new">
              <UserPlus className="h-4 w-4" />
              Новый пациент
            </Link>
          </Button>
        </div>
      ) : (
        <Stagger className="mt-6 grid gap-3 sm:grid-cols-2">
          {patients.map((p) => {
            const chips = patientChips(p.meta);
            return (
              <StaggerItem key={p.id} data-testid="patient-list-item">
                <Link
                  href={e2eFixtures ? `/demo/patient-card?id=${p.id}` : `/patients/${p.id}`}
                  className="premium-card group flex items-center gap-3 rounded-2xl p-4"
                >
                  <PatientAvatar label={p.display_label} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--clinical-foreground)]">{p.display_label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.external_ref ? (
                        <span className="rounded-md bg-[var(--clinical-muted)] px-1.5 py-0.5 text-[11px] text-[var(--clinical-foreground-muted)]">
                          № {p.external_ref}
                        </span>
                      ) : null}
                      {chips.map((c) => (
                        <span
                          key={c}
                          className="rounded-md bg-[var(--clinical-primary-muted)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--clinical-primary-deep)]"
                        >
                          {c}
                        </span>
                      ))}
                      {chips.length === 0 && !p.external_ref ? (
                        <span className="text-[11px] text-[var(--clinical-foreground-muted)]">Нет доп. данных</span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--clinical-primary)]" />
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {hasMore && !loading ? (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => void load(q, nextCursor, true)}
          >
            {loadingMore ? "Загрузка…" : "Показать ещё"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
