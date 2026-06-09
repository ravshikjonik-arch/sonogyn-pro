import { redirect } from "next/navigation";

import { MfaSettingsPanel } from "@/components/clinical/MfaSettingsPanel";
import { ProfileSettingsForm } from "@/components/clinical/profile-settings-form";
import { CLINICAL_AVATARS_BUCKET } from "@/lib/supabase/medical-storage";
import { createClient } from "@/utils/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile, error: profileError }, { data: doctor }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, institution, specialization, role, subscription_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("full_name, institution, specialization, avatar_storage_path")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const displayName =
    doctor?.full_name?.trim() || profile?.full_name?.trim() || "Заполните профиль";
  const initials =
    displayName === "Заполните профиль"
      ? "?"
      : displayName
          .split(/\s+/)
          .filter(Boolean)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  let avatarUrl: string | null = null;
  const storagePath = doctor?.avatar_storage_path;
  if (storagePath) {
    const { data: signed } = await supabase.storage
      .from(CLINICAL_AVATARS_BUCKET)
      .createSignedUrl(storagePath, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  const specialization =
    doctor?.specialization?.trim() || profile?.specialization?.trim() || null;

  return (
    <main className="px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Профиль врача</p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={displayName}
              className="h-24 w-24 rounded-3xl object-cover ring-4 ring-[var(--clinical-primary-muted)]"
              src={avatarUrl}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--clinical-primary-muted)] text-3xl font-black text-[var(--clinical-primary-deep)] ring-4 ring-[var(--clinical-ring)]">
              {initials}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{displayName}</h1>
            <p className="mt-2 text-base leading-7 text-[var(--clinical-foreground-muted)]">
              Email: <span className="font-bold text-slate-950 dark:text-white">{user.email}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              User ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">Роль</p>
            <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{profile?.role ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
              Специализация
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{specialization ?? "Не указана"}</p>
          </div>
        </div>

        {!profile && profileError ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium leading-6 text-amber-900">
            Не удалось загрузить строку <code className="rounded bg-white px-1">profiles</code>:{" "}
            {profileError.message}. Проверьте миграции Supabase.
          </div>
        ) : null}

        {!profile && !profileError ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium leading-6 text-amber-900">
            Запись профиля не найдена. После применения миграций триггер создаёт строки в{" "}
            <code className="rounded bg-white px-1">profiles</code> и{" "}
            <code className="rounded bg-white px-1">users</code> при регистрации.
          </div>
        ) : null}

        <ProfileSettingsForm
          initial={{
            full_name: doctor?.full_name ?? profile?.full_name ?? "",
            institution: doctor?.institution ?? profile?.institution ?? "",
            specialization: doctor?.specialization ?? profile?.specialization ?? "",
          }}
        />
        <MfaSettingsPanel />
      </section>
    </main>
  );
}
