"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export type CreateTeachingCaseResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createTeachingCaseFromCalculator(input: {
  title: string;
  description: string;
  anatomy?: string;
  pathology?: string;
  difficulty?: string;
  publish?: boolean;
}): Promise<CreateTeachingCaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Войдите в аккаунт врача" };

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title: input.title.trim() || "Кейс без названия",
      description: input.description.trim() || null,
      anatomy: input.anatomy?.trim() || null,
      pathology: input.pathology?.trim() || null,
      difficulty: input.difficulty ?? "intermediate",
      status: input.publish ? "published" : "draft",
      is_public: Boolean(input.publish),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, message: error?.message ?? "Не удалось создать кейс" };
  }

  revalidatePath("/cases");
  return { ok: true, id: data.id as string };
}
