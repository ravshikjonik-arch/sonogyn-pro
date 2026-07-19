import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import {
  chatMediaPathBelongsToScope,
  getChatMediaSignedUrl,
} from "@/lib/supabase/chat-media-storage";
import { createClient } from "@/utils/supabase/server";

const DoctorChatMessageBodySchema = z.object({
  channelId: z.string().uuid(),
  body: z.string().trim().max(5000).nullable().optional(),
  media_storage_path: z.string().trim().max(1000).nullable().optional(),
  media_type: z.enum(["image", "video"]).nullable().optional(),
});

/** Load recent messages for a doctor chat channel with server-side auth/RLS context. */
export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-chat-load", RL.casesListIp);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = z
    .object({
      channelId: z.string().uuid(),
    })
    .safeParse({ channelId: searchParams.get("channelId") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-chat-load", RL.casesListUser);
  if (userRl) return userRl;

  try {
    const { data, error } = await supabase
      .from("doctor_chat_messages")
      .select("id,channel_id,author_id,body,media_storage_path,media_type,created_at")
      .eq("channel_id", parsed.data.channelId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      safeLog("doctor chat load error", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const messages = await Promise.all(
      (data ?? []).map(async (row) => ({
        ...row,
        media_url: row.media_storage_path
          ? await getChatMediaSignedUrl(supabase, row.media_storage_path)
          : null,
      })),
    );

    return NextResponse.json({ messages });
  } catch (err) {
    safeLog("doctor chat load error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Send a message to a doctor chat channel with server-side auth/RLS context. */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-chat-send", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-chat-send", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = DoctorChatMessageBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body?.trim() || null;
  const mediaStoragePath = parsed.data.media_storage_path?.trim() || null;
  if (!body && !mediaStoragePath) {
    return NextResponse.json({ error: "Сообщение пустое." }, { status: 400 });
  }
  if (
    mediaStoragePath &&
    !chatMediaPathBelongsToScope(mediaStoragePath, {
      userId: auth.userId,
      scope: "channel",
      scopeId: parsed.data.channelId,
    })
  ) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("doctor_chat_messages")
      .insert({
        channel_id: parsed.data.channelId,
        author_id: auth.userId,
        body,
        media_storage_path: mediaStoragePath,
        media_type: parsed.data.media_type ?? null,
      })
      .select("id,channel_id,author_id,body,media_storage_path,media_type,created_at")
      .single();

    if (error || !data) {
      safeLog("doctor chat send error", { message: error?.message ?? "missing row" });
      return NextResponse.json({ error: error?.message ?? "Send failed" }, { status: 500 });
    }

    // Auto-subscribe author so they get push for later messages from colleagues.
    const { data: existingSub } = await supabase
      .from("channel_subscriptions")
      .select("user_id")
      .eq("user_id", auth.userId)
      .eq("channel_id", parsed.data.channelId)
      .maybeSingle();

    let autoSubscribed = false;
    if (!existingSub) {
      const { error: subError } = await supabase.from("channel_subscriptions").insert({
        user_id: auth.userId,
        channel_id: parsed.data.channelId,
      });
      if (subError) {
        safeLog("doctor chat auto-subscribe error", { message: subError.message });
      } else {
        autoSubscribed = true;
      }
    }

    return NextResponse.json(
      {
        message: {
          ...data,
          media_url: data.media_storage_path
            ? await getChatMediaSignedUrl(supabase, data.media_storage_path)
            : null,
        },
        autoSubscribed,
      },
      { status: 201 },
    );
  } catch (err) {
    safeLog("doctor chat send error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
