"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthorProfile = {
  bio: string | null;
  avatar_url: string | null;
  telegram: string | null;
  website: string | null;
  revenue_percent: number;
  full_name: string | null;
};

export function AuthorProfileClient() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/author/profile", { credentials: "same-origin" });
      const body = (await res.json()) as { ok?: boolean; profile?: AuthorProfile };
      if (body.profile) {
        setProfile(body.profile);
        setBio(body.profile.bio ?? "");
        setTelegram(body.profile.telegram ?? "");
        setWebsite(body.profile.website ?? "");
        setAvatarUrl(body.profile.avatar_url ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/author/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        bio: bio.trim() || null,
        telegram: telegram.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Не удалось сохранить профиль");
      return;
    }
    toast.success("Профиль автора сохранён");
  }

  if (loading) return <p className="text-sm text-slate-500">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Профиль автора</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {profile?.full_name ?? "Преподаватель"} · доля с продаж: {profile?.revenue_percent ?? 70}%
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Публичная карточка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">О себе</span>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Специализация, опыт, формат обучения…"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Avatar URL</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telegram</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Сайт</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить профиль"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
