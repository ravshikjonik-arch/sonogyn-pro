import { ArrowRight, Shield, Sparkles, Stethoscope } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AchievementsDashboard } from "@/components/achievements/AchievementsDashboard";
import { DashboardSpatialHub } from "@/components/clinical/DashboardSpatialHub";
import { VerifyDoctorReminderBanner } from "@/components/trust/VerifyDoctorReminderBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenAccessProfile } from "@/lib/auth/dev-account";
import { createClient } from "@/utils/supabase/server";

export default async function MedicalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const openProfile = getOpenAccessProfile();

  if (!user && !openProfile) {
    redirect("/login?redirectedFrom=/profile/dashboard");
  }

  const [{ data: profile }, { data: doctor }] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, specialization, institution, subscription_tier, trial_ends_at, role, is_verified")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("users").select("full_name, specialization, institution").eq("id", user.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const displayName =
    doctor?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    openProfile?.full_name ||
    user?.email?.split("@")[0] ||
    "коллега";

  const specialization =
    doctor?.specialization?.trim() || profile?.specialization?.trim() || openProfile?.specialization || null;
  const institution = doctor?.institution?.trim() || profile?.institution?.trim() || openProfile?.institution || null;

  const trialLabel = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const showVerifyBanner = Boolean(user && profile && !profile.is_verified);

  return (
    <div className="sonogyn-cosmos-bg sg-spatial-vignette min-h-[100dvh] px-4 py-10 lg:px-10">
      {showVerifyBanner ? <VerifyDoctorReminderBanner show /> : null}
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="relative overflow-hidden rounded-3xl border border-[var(--clinical-border)] bg-gradient-to-br from-white via-white to-[var(--clinical-primary-muted)] p-8 shadow-sm md:p-10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="border-[var(--clinical-primary)] text-[var(--clinical-primary-deep)]">
                Кабинет врача
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                Добро пожаловать, {displayName}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--clinical-foreground-muted)]">
                Здесь собраны основные рабочие зоны: калькуляторы, кейсы, AI-помощник, справочник и статус доступа.
                Начинайте с клинической задачи, а не с поиска нужного раздела.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {specialization ? (
                  <Badge variant="outline" className="border-[var(--clinical-border)] font-normal">
                    {specialization}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal">
                    Специальность не указана
                  </Badge>
                )}
                {institution ? (
                  <Badge variant="outline" className="font-normal">
                    {institution}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="font-normal capitalize">
                  Доступ: {profile?.subscription_tier ?? (openProfile ? "открытый режим" : "базовый")}
                </Badge>
                {profile?.role === "admin" ? (
                  <Badge className="gap-1 font-normal">
                    <Shield className="h-3 w-3" />
                    Администратор
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild className="rounded-2xl px-6 shadow-md">
                <Link href="/app">
                  Рабочий кабинет
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild className="rounded-2xl px-6">
                <Link href="/profile">Профиль и доступ</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Профиль и сессия</CardTitle>
              <CardDescription>
                {openProfile
                  ? "Открытый режим без регистрации: персональное сохранение отключено."
                  : "Вы вошли в аккаунт; персональные разделы открываются через защищённую сессию."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              <p>
                <span className="font-semibold text-[var(--clinical-foreground)]">Email:</span>{" "}
                <span className="break-all">{user?.email ?? openProfile?.email}</span>
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                ID сессии {user?.id ?? "открытый режим"}
              </p>
              {trialLabel ? (
                <p>
                  <span className="font-semibold text-[var(--clinical-foreground)]">Пробный доступ:</span> до{" "}
                  {trialLabel}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Безопасность данных</CardTitle>
              <CardDescription>Работайте без ФИО, телефона, адреса и номера карты пациентки.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              <p>
                Для пилота используйте обезличенные кейсы. Изображения и обсуждения должны храниться без данных,
                по которым можно прямо идентифицировать пациентку.
              </p>
              <Button variant="outline" size="sm" className="w-fit rounded-xl" asChild>
                <Link href="/paywall">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Тарифы и доступ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Звёзды и награды</h2>
            <Button variant="ghost" size="sm" className="text-[var(--clinical-primary-deep)]" asChild>
              <Link href="/achievements">Все бейджи →</Link>
            </Button>
          </div>
          <AchievementsDashboard />
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="text-[var(--clinical-primary-deep)]" asChild>
            <Link href="/tools/mapping/uterus">
              <Stethoscope className="mr-2 h-4 w-4" />
              3D-модель матки
            </Link>
          </Button>
        </div>
        <DashboardSpatialHub />
      </div>
    </div>
  );
}
