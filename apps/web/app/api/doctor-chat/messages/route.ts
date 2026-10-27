import { NextResponse } from "next/server";
import { z } from "zod";

import { openDoctorChatDb } from "@/lib/chat/open-doctor-chat-db";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { safeLog } from "@/lib/security/safeLog";
import {
  chatMediaPathBelongsToScope,
  getChatMediaSignedUrl,
} from "@/lib/supabase/chat-media-storage";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";

const PAGE_SIZE = 40;

function searchPattern(query: string): string {
  const clean = query.replace(/[%_\\]/g, " ").trim();
  return `%${clean}%`;
}

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
      messageId: z.string().uuid().optional(),
      before: z.string().min(10).max(40).optional(),
      q: z.string().trim().max(80).optional(),
    })
    .safeParse({
      channelId: searchParams.get("channelId"),
      messageId: searchParams.get("messageId") ?? undefined,
      before: searchParams.get("before") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const opened = await openDoctorChatDb(request);
  if (!opened.ok) return opened.response;
  const { db, authorId, guest } = opened;

  if (!guest) {
    const userRl = await rejectIfRateLimitedForUser(authorId, "doctor-chat-load", RL.casesListUser);
    if (userRl) return userRl;
  }

  try {
    let query = db
      .from("doctor_chat_messages")
      .select("id,channel_id,author_id,body,media_storage_path,media_type,created_at")
      .eq("channel_id", parsed.data.channelId);

    let hasMore = false;
    if (parsed.data.messageId) {
      query = query.eq("id", parsed.data.messageId);
    } else {
      query = query.order("created_at", { ascending: false }).limit(PAGE_SIZE + 1);
      if (parsed.data.before) query = query.lt("created_at", parsed.data.before);
      if (parsed.data.q) query = query.ilike("body", searchPattern(parsed.data.q));
    }

    const { data, error } = await query;

    if (error) {
      safeLog("doctor chat load error", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const page = parsed.data.messageId ? (data ?? []) : (data ?? []).slice(0, PAGE_SIZE);
    hasMore = !parsed.data.messageId && (data ?? []).length > PAGE_SIZE;
    const ordered = parsed.data.messageId ? page : [...page].reverse();

    const messages = await Promise.all(
      ordered.map(async (row) => ({
        ...row,
        media_url: row.media_storage_path
          ? await getChatMediaSignedUrl(db, row.media_storage_path)
          : null,
      })),
    );
    const authorNames = await resolveAuthorNames(
      db,
      messages.map((row) => row.author_id),
    );

    return NextResponse.json({
      messages,
      authorNames,
      hasMore,
      nextBefore: ordered[0]?.created_at ?? null,
    });
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

  const opened = await openDoctorChatDb(request);
  if (!opened.ok) return opened.response;
  const { db, authorId, guest } = opened;

  if (guest) {
    return NextResponse.json(
      { error: "Чтобы написать коллегам, войдите. Читать чат можно без входа." },
      { status: 401 },
    );
  }

  const userRl = await rejectIfRateLimitedForUser(authorId, "doctor-chat-send", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = DoctorChatMessageBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body?.trim() || null;
  const mediaStoragePath = parsed.data.media_storage_path?.trim() || null;

  const phiBlocked = rejectIfPhiInTextFields([body]);
  if (phiBlocked) return phiBlocked;

  if (!body && !mediaStoragePath) {
    return NextResponse.json({ error: "Сообщение пустое." }, { status: 400 });
  }
  if (
    mediaStoragePath &&
    !chatMediaPathBelongsToScope(mediaStoragePath, {
      userId: authorId,
      scope: "channel",
      scopeId: parsed.data.channelId,
    })
  ) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  try {
    const { data, error } = await db
      .from("doctor_chat_messages")
      .insert({
        channel_id: parsed.data.channelId,
        author_id: authorId,
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

    let autoSubscribed = false;
    if (!guest) {
      const { data: existingSub } = await db
        .from("channel_subscriptions")
        .select("user_id")
        .eq("user_id", authorId)
        .eq("channel_id", parsed.data.channelId)
        .maybeSingle();

      if (!existingSub) {
        const { error: subError } = await db.from("channel_subscriptions").insert({
          user_id: authorId,
          channel_id: parsed.data.channelId,
        });
        if (subError) {
          safeLog("doctor chat auto-subscribe error", { message: subError.message });
        } else {
          autoSubscribed = true;
        }
      }
    }

    return NextResponse.json(
      {
        message: {
          ...data,
          media_url: data.media_storage_path
            ? await getChatMediaSignedUrl(db, data.media_storage_path)
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
