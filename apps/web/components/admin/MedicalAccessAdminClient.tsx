"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type MedicalAccessStatus =
  | "pending"
  | "student"
  | "resident"
  | "doctor"
  | "verified_doctor"
  | "suspended";

export type MedicalAccessUserRow = {
  id: string;
  full_name: string | null;
  institution: string | null;
  specialization: string | null;
  role: string | null;
  created_at: string | null;
  medical_access_status: MedicalAccessStatus | null;
  medical_license_number: string | null;
  medical_verified_at: string | null;
  medical_verification_note: string | null;
};

const STATUS_OPTIONS: Array<{ value: MedicalAccessStatus; label: string; tone: string }> = [
  { value: "pending", label: "Ожидает", tone: "bg-amber-50 text-amber-900 border-amber-200" },
  { value: "student", label: "Студент", tone: "bg-sky-50 text-sky-900 border-sky-200" },
  { value: "resident", label: "Ординатор", tone: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  { value: "doctor", label: "Врач", tone: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  { value: "verified_doctor", label: "Подтвержденный врач", tone: "bg-teal-50 text-teal-900 border-teal-200" },
  { value: "suspended", label: "Заблокирован", tone: "bg-rose-50 text-rose-900 border-rose-200" },
];

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label])) as Record<
  MedicalAccessStatus,
  string
>;

function statusTone(status: MedicalAccessStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.tone ?? STATUS_OPTIONS[0]!.tone;
}

export function MedicalAccessAdminClient({ users }: { users: MedicalAccessUserRow[] }) {
  const [rows, setRows] = useState(users);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    return rows.reduce<Record<MedicalAccessStatus, number>>(
      (acc, row) => {
        const status = row.medical_access_status ?? "pending";
        acc[status] += 1;
        return acc;
      },
      { pending: 0, student: 0, resident: 0, doctor: 0, verified_doctor: 0, suspended: 0 },
    );
  }, [rows]);

  function updateStatus(userId: string, status: MedicalAccessStatus) {
    setBusyId(userId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/medical-access/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note: notes[userId] ?? "" }),
        });
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          toast.error(body?.error ?? "Не удалось изменить статус");
          return;
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === userId
              ? {
                  ...row,
                  medical_access_status: status,
                  medical_verified_at:
                    status === "pending" ? null : new Date().toISOString(),
                  medical_verification_note: notes[userId] ?? null,
                }
              : row,
          ),
        );
        toast.success(`Статус: ${STATUS_LABEL[status]}`);
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATUS_OPTIONS.map((status) => (
          <div key={status.value} className={cn("rounded-xl border p-4", status.tone)}>
            <p className="text-xs font-bold uppercase">{status.label}</p>
            <p className="mt-2 text-2xl font-black">{stats[status.value]}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
        <div className="border-b border-[var(--clinical-border)] px-5 py-4">
          <p className="text-sm font-black text-[var(--clinical-foreground)]">Заявки и пользователи</p>
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            Меняйте медицинский статус только после проверки профиля, документа или личного подтверждения.
          </p>
        </div>

        <div className="divide-y divide-[var(--clinical-border)]">
          {rows.map((user) => {
            const status = user.medical_access_status ?? "pending";
            return (
              <article key={user.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-[var(--clinical-foreground)]">
                      {user.full_name?.trim() || "Без ФИО"}
                    </p>
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", statusTone(status))}>
                      {STATUS_LABEL[status]}
                    </span>
                    {user.role === "admin" || user.role === "moderator" ? (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-900">
                        {user.role}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-2 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-2">
                    <p>Специализация: {user.specialization || "не указана"}</p>
                    <p>Учреждение: {user.institution || "не указано"}</p>
                    <p>Документ/номер: {user.medical_license_number || "не указан"}</p>
                    <p>
                      Проверка:{" "}
                      {user.medical_verified_at
                        ? new Date(user.medical_verified_at).toLocaleDateString("ru-RU")
                        : "не проводилась"}
                    </p>
                  </div>

                  {user.medical_verification_note ? (
                    <p className="rounded-xl bg-[var(--clinical-muted)] px-3 py-2 text-xs text-[var(--clinical-foreground-muted)]">
                      {user.medical_verification_note}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <textarea
                    value={notes[user.id] ?? ""}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [user.id]: event.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clinical-primary)]"
                    placeholder="Заметка проверки: диплом, аккредитация, личное подтверждение"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={option.value === status ? "default" : "outline"}
                        size="sm"
                        disabled={isPending && busyId === user.id}
                        className="justify-start gap-1.5"
                        onClick={() => updateStatus(user.id, option.value)}
                      >
                        {option.value === status ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}

          {rows.length === 0 ? (
            <p className="p-5 text-sm text-[var(--clinical-foreground-muted)]">Пользователей пока нет.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
