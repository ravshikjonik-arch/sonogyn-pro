"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export type SaveCalculatorResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function saveCalculatorEntry(input: {
  slug: string;
  calculatorCode: string;
  payload: Record<string, unknown>;
  summary?: string;
}): Promise<SaveCalculatorResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("calculator_entries")
    .insert({
      user_id: user.id,
      calculator_code: input.calculatorCode,
      payload: input.payload,
      summary: input.summary ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/calculators");
  revalidatePath("/calculators/elastography");
  revalidatePath(`/calculators/${input.slug}`);
  return { ok: true, id: data.id as string };
}
