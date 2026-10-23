import { NextResponse } from "next/server";
import { z } from "zod";

import { MessengerMessagesQuerySchema, MessengerSendBodySchema } from "@repo/types";

import { rejectUnlessDoctorChatV2Enabled } from "@/lib/messenger/guard-v2";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { enrichMessengerMessages } from "@/lib/messenger/enrich-messages";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import {
  chatMediaPathBelongsToScope,
} from "@/lib/supabase/chat-media-storage";
import { createClient } from "@/utils/supabase/server";

/** Cursor history for messenger v2 (seq-based, ascending in response). */
export async function GET(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  const limited = await rejectIfRateLimitedPreset(request, "messenger-messages-load", RL.casesListIp);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");

  const parsed = MessengerMessagesQuerySchema.safeParse({
    chatId: searchParams.get("chatId"),
    beforeSeq: searchParams.get("beforeSeq") ?? undefined,
    afterSeq: searchParams.get("afterSeq") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (messageId) {
    const chatId = searchParams.get("chatId");
    if (!chatId || !z.string().uuid().safeParse(chatId).success) {
      return NextResponse.json({ error: "chatId required with messageId" }, { status: 400 });
    }
    if (!z.string().uuid().safeParse(messageId).success) {
      return NextResponse.json({ error: "Invalid messageId" }, { status: 400 });
    }

    const supabase = await createClient();
    const auth = await requireSupabaseUserFromRequest(request, supabase);
    if (!auth.ok) return auth.response;

    const { data: row, error } = await supabase
      .from("messenger_messages")
      .select(
        "id,chat_id,seq,client_uuid,sender_id,message_type,body,reply_to_message_id,edited_at,deleted_at,created_at",
      )
      .eq("id", messageId)
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }

    const { data: attachments } = await supabase
      .from("messenger_message_attachments")
      .select("id,message_id,storage_path,media_type,byte_size,width,height,preview_storage_path")
      .eq("message_id", messageId);

    const [message] = await enrichMessengerMessages(supabase, [row], attachments ?? []);
    return NextResponse.json({ message });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(
    auth.userId,
    "messenger-messages-load",
    RL.casesListUser,
  );
  if (userRl) return userRl;

  const { chatId, beforeSeq, afterSeq, limit } = parsed.data;

  const ascending = afterSeq != null;

  let query = supabase
    .from("messenger_messages")
    .select(
      "id,chat_id,seq,client_uuid,sender_id,message_type,body,reply_to_message_id,edited_at,deleted_at,created_at",
    )
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("seq", { ascending })
    .limit(limit);

  if (beforeSeq != null) {
    query = query.lt("seq", beforeSeq);
  }
  if (afterSeq != null) {
    query = query.gt("seq", afterSeq);
  }

  const { data: rowsDesc, error } = await query;
  if (error) {
    safeLog("messenger messages load", { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ascending ? [...(rowsDesc ?? [])] : [...(rowsDesc ?? [])].reverse();
  const ids = rows.map((r) => r.id);

  const { data: attachments, error: attErr } =
    ids.length > 0
      ? await supabase
          .from("messenger_message_attachments")
          .select("id,message_id,storage_path,media_type,byte_size,width,height,preview_storage_path")
          .in("message_id", ids)
      : { data: [], error: null };

  if (attErr) {
    safeLog("messenger attachments load", { message: attErr.message });
    return NextResponse.json({ error: attErr.message }, { status: 500 });
  }

  const messages = await enrichMessengerMessages(supabase, rows, attachments ?? []);

  const nextBeforeSeq = !ascending && rows.length > 0 ? rows[0]!.seq : null;
  const lastSeq = rows.length > 0 ? rows[rows.length - 1]!.seq : null;

  return NextResponse.json({
    messages,
    page: {
      limit,
      beforeSeq: beforeSeq ?? null,
      afterSeq: afterSeq ?? null,
      nextBeforeSeq,
      lastSeq,
      hasMore: rows.length === limit,
    },
  });
}

/** Idempotent send via messenger_send_message RPC. */
export async function POST(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  const limited = await rejectIfRateLimitedPreset(request, "messenger-messages-send", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "messenger-messages-send", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = MessengerSendBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body?.trim() || null;
  const attachmentPath = parsed.data.attachmentStoragePath?.trim() || null;
  const attachmentType = parsed.data.attachmentMediaType ?? null;

  const phiBlocked = rejectIfPhiInTextFields([body]);
  if (phiBlocked) return phiBlocked;

  if (
    attachmentPath &&
    !chatMediaPathBelongsToScope(attachmentPath, {
      userId: auth.userId,
      scope: "channel",
      scopeId: parsed.data.chatId,
    })
  ) {
    // v2 channel chats use legacy channel id in media path scope — resolve legacy id
    const { data: chatRow } = await supabase
      .from("messenger_chats")
      .select("legacy_doctor_channel_id")
      .eq("id", parsed.data.chatId)
      .maybeSingle();

    const legacyId = chatRow?.legacy_doctor_channel_id as string | null;
    const scopeOk =
      legacyId &&
      chatMediaPathBelongsToScope(attachmentPath, {
        userId: auth.userId,
        scope: "channel",
        scopeId: legacyId,
      });

    if (!scopeOk) {
      return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
    }
  }

  const { data: message, error } = await supabase.rpc("messenger_send_message", {
    p_chat_id: parsed.data.chatId,
    p_client_uuid: parsed.data.clientUuid,
    p_body: body,
    p_reply_to_message_id: parsed.data.replyToMessageId ?? null,
    p_attachment_storage_path: attachmentPath,
    p_attachment_media_type: attachmentType,
  });

  if (error || !message) {
    safeLog("messenger send", { message: error?.message ?? "missing row" });
    const status = error?.message?.includes("access denied") ? 403 : 500;
    return NextResponse.json({ error: error?.message ?? "Send failed" }, { status });
  }

  const { data: attachments } = await supabase
    .from("messenger_message_attachments")
    .select("id,message_id,storage_path,media_type,byte_size,width,height,preview_storage_path")
    .eq("message_id", message.id);

  const [enriched] = await enrichMessengerMessages(
    supabase,
    [message],
    attachments ?? [],
  );

  return NextResponse.json({ message: enriched }, { status: 201 });
}
