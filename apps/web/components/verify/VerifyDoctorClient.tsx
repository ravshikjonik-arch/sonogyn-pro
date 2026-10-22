"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DoctorVerifiedBadge } from "@/components/trust/DoctorVerifiedBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DOCTOR_VERIFICATION_SPECIALIZATIONS,
  type DoctorVerificationSpecialization,
} from "@/lib/trust/verification-constants";
import type { DoctorVerificationRow } from "@/lib/trust/verification-schemas";
import { validateVerificationDiplomaUpload } from "@/lib/security/file-validation";

type Props = {
  initialVerification: DoctorVerificationRow | null;
  profileVerified: boolean;
  defaultFullName: string;
  defaultSpecialization: string | null;
};

export function VerifyDoctorClient({
  initialVerification,
  profileVerified,
  defaultFullName,
  defaultSpecialization,
}: Props) {
  const [verification, setVerification] = useState<DoctorVerificationRow | null>(initialVerification);
  const [fullName, setFullName] = useState(defaultFullName);
  const [birthDate, setBirthDate] = useState("");
  const [specialization, setSpecialization] = useState<DoctorVerificationSpecialization>(
    DOCTOR_VERIFICATION_SPECIALIZATIONS.includes(
      (defaultSpecialization ?? "") as DoctorVerificationSpecialization,
    )
      ? ((defaultSpecialization ?? DOCTOR_VERIFICATION_SPECIALIZATIONS[0]) as DoctorVerificationSpecialization)
      : DOCTOR_VERIFICATION_SPECIALIZATIONS[0],
  );
  const [diplomaNumber, setDiplomaNumber] = useState("");
  const [orgName, setOrgName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    !profileVerified &&
    (!verification || verification.status === "rejected" || verification.status === "expired");

  async function openOwnDiploma() {
    const res = await fetch("/api/verify/diploma-url");
    const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !body?.url) {
      toast.error(body?.error ?? "Не удалось открыть файл");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  const reload = useCallback(async () => {
    const res = await fetch("/api/verify/status");
    const body = (await res.json().catch(() => null)) as {
      verification?: DoctorVerificationRow | null;
      is_verified?: boolean;
    } | null;
    if (body?.verification !== undefined) setVerification(body.verification);
  }, []);

  useEffect(() => {
    if (verification?.status === "rejected") {
      setFullName(verification.full_name);
      setSpecialization(verification.specialization as DoctorVerificationSpecialization);
      setDiplomaNumber(verification.diploma_number ?? "");
      setOrgName(verification.org_name ?? "");
      if (verification.birth_date) setBirthDate(verification.birth_date.slice(0, 10));
    }
  }, [verification]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Прикрепите скан диплома или сертификата");
      return;
    }
    const check = await validateVerificationDiplomaUpload(file);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("full_name", fullName);
      if (birthDate) form.append("birth_date", birthDate);
      form.append("specialization", specialization);
      if (diplomaNumber) form.append("diploma_number", diplomaNumber);
      if (orgName) form.append("org_name", orgName);
      form.append("file", file);

      const res = await fetch("/api/verify/submit", { method: "POST", body: form });
      const body = (await res.json().catch(() => null)) as { error?: string; verification?: DoctorVerificationRow };
      if (!res.ok) {
        toast.error(typeof body?.error === "string" ? body.error : "Не удалось отправить заявку");
        return;
      }
      toast.success("Заявка отправлена на проверку");
      setVerification(body.verification ?? null);
      setFile(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (profileVerified || verification?.status === "approved") {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
        <DoctorVerifiedBadge />
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground)]">
          Ваш статус врача подтверждён. В чате и ленте кейсов отображается значок ✓.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/profile/dashboard">В кабинет</Link>
        </Button>
      </div>
    );
  }

  if (verification?.status === "pending") {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-6 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-bold text-[var(--clinical-foreground)]">Заявка на проверке</p>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Обычно модерация занимает до 3 рабочих дней. Мы проверим данные и скан диплома. Статус
          обновится автоматически — можно вернуться на эту страницу позже.
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Отправлено: {new Date(verification.submitted_at).toLocaleString("ru-RU")}
        </p>
        {verification.diploma_file_path ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void openOwnDiploma()}
          >
            Посмотреть загруженный скан
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {verification?.status === "rejected" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
          <p className="font-semibold text-rose-900 dark:text-rose-100">Заявка отклонена</p>
          <p className="mt-2 text-[var(--clinical-foreground-muted)]">
            {verification.rejection_reason ?? "Уточните данные и отправьте заявку снова."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="verify-full-name">
            ФИО
          </label>
          <Input
            id="verify-full-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="verify-birth">
            Дата рождения
          </label>
          <Input
            id="verify-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="verify-spec">
            Специализация
          </label>
          <select
            id="verify-spec"
            className="flex h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value as DoctorVerificationSpecialization)}
          >
            {DOCTOR_VERIFICATION_SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="verify-diploma">
            Номер диплома / сертификата
          </label>
          <Input
            id="verify-diploma"
            value={diplomaNumber}
            onChange={(e) => setDiplomaNumber(e.target.value)}
            placeholder="Необязательно, если указан на скане"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="verify-org">
            Место работы
          </label>
          <Input
            id="verify-org"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Необязательно"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="verify-file">
            Скан диплома (JPG, PNG или PDF, до 10 МБ)
          </label>
          <Input
            id="verify-file"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Документ хранится в защищённом хранилище и доступен только вам и модераторам. Не загружайте
        данные пациентов.
      </p>

      {canSubmit ? (
        <Button type="submit" disabled={busy}>
          {busy ? "Отправка…" : "Отправить на проверку"}
        </Button>
      ) : null}
    </form>
  );
}
