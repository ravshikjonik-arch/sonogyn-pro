import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthorApi } from "@/lib/courses/api-handler";

const patchSchema = z.object({
  bio: z.string().max(5000).nullable().optional(),
  avatar_url: z.union([z.string().url().max(2000), z.literal(""), z.null()]).optional(),
  telegram: z.string().max(200).nullable().optional(),
  website: z.union([z.string().url().max(2000), z.literal(""), z.null()]).optional(),
});

export async function GET() {
  return withAuthorApi(async ({ supabase, userId }) => {
    const [{ data: authorProfile }, { data: profile }] = await Promise.all([
      supabase.from("author_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);

    if (!authorProfile) {
      await supabase.from("author_profiles").insert({ user_id: userId });
      const { data: created } = await supabase.from("author_profiles").select("*").eq("user_id", userId).maybeSingle();
      return NextResponse.json({
        ok: true,
        profile: {
          bio: created?.bio ?? null,
          avatar_url: created?.avatar_url ?? null,
          telegram: created?.telegram ?? null,
          website: created?.website ?? null,
          revenue_percent: created?.revenue_percent ?? 70,
          full_name: profile?.full_name ?? null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        bio: authorProfile.bio,
        avatar_url: authorProfile.avatar_url,
        telegram: authorProfile.telegram,
        website: authorProfile.website,
        revenue_percent: authorProfile.revenue_percent,
        full_name: profile?.full_name ?? null,
      },
    });
  });
}

export async function PATCH(req: Request) {
  return withAuthorApi(async ({ supabase, userId }) => {
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const patch = {
      ...parsed.data,
      avatar_url: parsed.data.avatar_url === "" ? null : parsed.data.avatar_url,
      website: parsed.data.website === "" ? null : parsed.data.website,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("author_profiles")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();

    return NextResponse.json({
      ok: true,
      profile: {
        bio: data.bio,
        avatar_url: data.avatar_url,
        telegram: data.telegram,
        website: data.website,
        revenue_percent: data.revenue_percent,
        full_name: profile?.full_name ?? null,
      },
    });
  });
}
