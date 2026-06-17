import { NextResponse } from "next/server";
import { z } from "zod";

import { getTrainingSessionById } from "@/lib/education/live-learning";
import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const TrainingRegistrationBodySchema = z
  .object({
    sessionId: z.string().min(1).max(120).regex(/^[a-z0-9._-]+$/i),
    fullName: z.string().max(160).optional().default(""),
    email: z.string().email().max(160).optional().or(z.literal("")).default(""),
    question: z.string().max(1000).optional().default(""),
    preferredSubtitleLanguage: z.enum(["ru", "en", "es"]).default("ru"),
  })
  .strict();

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "education-registration", RL.educationRegistration);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = TrainingRegistrationBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = getTrainingSessionById(parsed.data.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Занятие не найдено" }, { status: 404 });
  }

  const { error } = await supabase.from("education_registrations").insert({
    session_id: session.id,
    session_title: session.title,
    user_id: user.id,
    full_name: parsed.data.fullName.trim() || null,
    email: parsed.data.email.trim() || user.email || null,
    question: parsed.data.question.trim() || null,
    preferred_subtitle_language: parsed.data.preferredSubtitleLanguage,
  });

  if (error) {
    safeLog("education registration insert failed", { code: error.code });
    return NextResponse.json(
      { error: "Не удалось сохранить заявку. Проверьте миграцию Supabase education_registrations." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
