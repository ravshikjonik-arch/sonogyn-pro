import Link from "next/link";
import { redirect } from "next/navigation";

import {
  DoctorVerificationsAdminClient,
  type AdminVerificationRow,
} from "@/components/admin/DoctorVerificationsAdminClient";
import { Button } from "@/components/ui/button";
import { isAdminEmail } from "@/lib/security/admin-emails";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/verifications");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const roleAdmin = profile?.role === "admin";
  const emailModerator = isAdminEmail(user.email);
  if (!roleAdmin && !emailModerator) {
    redirect("/app");
  }

  const listClient = roleAdmin ? supabase : createServiceRoleClient();

  const { data: pending, error } = await listClient
    .from("doctor_verifications")
    .select(
      "id,user_id,status,full_name,birth_date,specialization,diploma_number,diploma_file_path,org_name,submitted_at,reviewed_at,rejection_reason",
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  const rows: AdminVerificationRow[] = (pending ?? []) as AdminVerificationRow[];

  if (rows.length) {
    try {
      const admin = createServiceRoleClient();
      const ids = [...new Set(rows.map((r) => r.user_id))];
      const emails = new Map<string, string>();
      for (const id of ids) {
        const { data: authUser } = await admin.auth.admin.getUserById(id);
        if (authUser.user?.email) emails.set(id, authUser.user.email);
      }
      for (const row of rows) {
        row.user_email = emails.get(row.user_id) ?? null;
      }
    } catch {
      /* service role optional in dev */
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Модерация
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Заявки на подтверждение врача
        </h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Просмотр диплома — по подписанной ссылке (60 с). Решение записывается в базу; клиент не
          меняет <code className="text-xs">is_verified</code> напрямую.
        </p>
        {error ? (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Не удалось загрузить очередь: {error.message}. Примените миграцию{" "}
            <code className="text-xs">20261022_verification_reputation.sql</code>.
          </p>
        ) : null}
      </header>

      <DoctorVerificationsAdminClient rows={rows} />

      <Button asChild variant="outline" size="sm">
        <Link href="/admin">← Админ-раздел</Link>
      </Button>
    </div>
  );
}
