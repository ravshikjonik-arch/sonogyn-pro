"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth, useSupabase } from "@/app/providers";
import { useNetworkStatus } from "@/components/network/NetworkProvider";
import type { ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import {
  markDoctorChatOpenStart,
  measureDoctorChatOpenEnd,
} from "@/lib/chat/perf-baseline";
import {
  resolveDoctorChatLoadState,
  type DoctorChatLoadState,
} from "@/lib/chat/resolve-doctor-chat-load-state";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import { resolveAuthorTrust, type AuthorTrustMap } from "@/lib/trust/resolve-author-trust";
import {
  fetchMessengerMessageById,
  fetchMessengerMessages,
  resolveChannelChatId,
  sendMessengerMessage,
  type MessengerMessageDto,
} from "@/lib/messenger/api-client";
import { detectSeqGap, type MessengerRealtimeRow } from "@/lib/messenger/realtime/parse-message-row";
import {
  sendMessengerTypingBroadcast,
  useMessengerRealtime,
} from "@/lib/messenger/realtime/use-messenger-realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { messageCacheGet, messageCacheSet } from "@/lib/messenger/outbox/idb";
import {
  loadOutboxForChat,
  patchOutboxStatus,
  removeOutboxEntry,
  saveOutboxEntry,
} from "@/lib/messenger/outbox/outbox-store";
import type { MessengerOutboxEntry } from "@/lib/messenger/outbox/types";
import {
  maxSeqFromMerged,
  mergeMessengerMessages,
  type MergedMessengerMessage,
} from "@/lib/messenger/sync/merge-messages";
import { validateChatMediaUpload } from "@/lib/security/file-validation";
import { detectPhi, PHI_BLOCK_MESSAGE } from "@/lib/security/phi-detection";

type Params = {
  legacyChannelId: string;
};

function dtoToServerRow(m: MessengerMessageDto): Parameters<typeof mergeMessengerMessages>[0][0] {
  return {
    id: m.id,
    client_uuid: m.client_uuid,
    seq: m.seq,
    chat_id: m.chat_id,
    sender_id: m.sender_id,
    body: m.body,
    created_at: m.created_at,
    attachments: m.attachments?.map((a) => ({
      media_type: a.media_type,
      media_url: a.media_url,
    })),
  };
}

function toBubble(m: MergedMessengerMessage): ChatBubbleMessage {
  return {
    id: m.id,
    body: m.body,
    author_id: m.sender_id,
    created_at: m.created_at,
    media_type: m.media_type,
    media_url: m.media_url,
    send_status: m.send_status,
    client_uuid: m.client_uuid,
  };
}

export function useMessengerChannel({ legacyChannelId }: Params) {
  const supabase = useSupabase();
  const { ready, user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [chatId, setChatId] = useState<string | null>(null);
  const [serverRows, setServerRows] = useState<MessengerMessageDto[]>([]);
  const [outbox, setOutbox] = useState<MessengerOutboxEntry[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [authorTrust, setAuthorTrust] = useState<AuthorTrustMap>({});
  const [loading, setLoading] = useState(true);
  const [loadState, setLoadState] = useState<DoctorChatLoadState | null>(null);
  const flushingRef = useRef(false);
  const maxSeqRef = useRef<number | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [realtimeReady, setRealtimeReady] = useState(false);

  const merged = useMemo(() => {
    if (!user?.id) return [];
    return mergeMessengerMessages(
      serverRows.map(dtoToServerRow),
      outbox,
      user.id,
    );
  }, [outbox, serverRows, user?.id]);

  const messages = useMemo(() => merged.map(toBubble), [merged]);

  const refreshAuthors = useCallback(
    async (rows: MergedMessengerMessage[]) => {
      const ids = [...new Set(rows.map((r) => r.sender_id))];
      const [names, trust] = await Promise.all([
        resolveAuthorNames(supabase, ids),
        resolveAuthorTrust(supabase, ids),
      ]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
      setAuthorTrust((prev) => ({ ...prev, ...trust }));
    },
    [supabase],
  );

  const applyServerPage = useCallback(
    async (rows: MessengerMessageDto[], mode: "replace" | "append" | "merge" | "prepend") => {
      setServerRows((prev) => {
        const map = new Map<string, MessengerMessageDto>();
        if (mode === "replace") {
          for (const r of rows) map.set(r.client_uuid, r);
        } else {
          for (const p of prev) map.set(p.client_uuid, p);
          for (const r of rows) map.set(r.client_uuid, r);
        }
        const next = [...map.values()].sort((a, b) => a.seq - b.seq);
        const max = next.length > 0 ? next[next.length - 1]!.seq : null;
        maxSeqRef.current = max;
        return next;
      });
    },
    [],
  );

  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const syncOutbox = useCallback(async (cid: string) => {
    const entries = await loadOutboxForChat(cid);
    setOutbox(entries);
    return entries;
  }, []);

  const flushEntry = useCallback(
    async (entry: MessengerOutboxEntry) => {
      if (!isOnline) return;
      await patchOutboxStatus(entry, "sending", null);
      setOutbox((prev) =>
        prev.map((e) => (e.clientUuid === entry.clientUuid ? { ...e, status: "sending" } : e)),
      );

      try {
        const sent = await sendMessengerMessage({
          chatId: entry.chatId,
          clientUuid: entry.clientUuid,
          body: entry.body,
          attachmentStoragePath: entry.attachmentStoragePath,
          attachmentMediaType: entry.attachmentMediaType,
        });
        await removeOutboxEntry(entry.clientUuid);
        setOutbox((prev) => prev.filter((e) => e.clientUuid !== entry.clientUuid));
        await applyServerPage([sent], "merge");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Send failed";
        const patched = await patchOutboxStatus(entry, "failed", message);
        setOutbox((prev) =>
          prev.map((e) => (e.clientUuid === patched.clientUuid ? patched : e)),
        );
        toast.error("Не отправилось — нажмите «Повторить»");
      }
    },
    [applyServerPage, isOnline],
  );

  const flushOutbox = useCallback(async () => {
    if (!chatId || flushingRef.current || !isOnline) return;
    flushingRef.current = true;
    try {
      const entries = await loadOutboxForChat(chatId);
      for (const entry of entries) {
        if (entry.status === "pending" || entry.status === "failed") {
          await flushEntry(entry);
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [chatId, flushEntry, isOnline]);

  const loadInitial = useCallback(async () => {
    if (!ready) return;
    if (!user) {
      setLoadState(
        resolveDoctorChatLoadState({ hasUser: false, httpStatus: null, errorMessage: null }),
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    markDoctorChatOpenStart();

    try {
      const cid = await resolveChannelChatId(legacyChannelId);
      setChatId(cid);

      const cached = await messageCacheGet(cid).catch(() => undefined);
      if (cached && Array.isArray(cached.messages)) {
        setServerRows(cached.messages as MessengerMessageDto[]);
        setLoading(false);
      }

      await syncOutbox(cid);
      const { messages: page, hasMore } = await fetchMessengerMessages({ chatId: cid, limit: 80 });
      await applyServerPage(page, "replace");
      setHasMoreHistory(hasMore);
      setLoadState(null);
      measureDoctorChatOpenEnd(page.length);

      await messageCacheSet({
        chatId: cid,
        messages: page,
        maxSeq: maxSeqRef.current,
        savedAt: new Date().toISOString(),
      });

      await refreshAuthors(mergeMessengerMessages(page.map(dtoToServerRow), [], user.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Load failed";
      setLoadState(
        resolveDoctorChatLoadState({
          hasUser: true,
          httpStatus: message.includes("401") ? 401 : 500,
          errorMessage: message,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [applyServerPage, legacyChannelId, ready, refreshAuthors, syncOutbox, user]);

  const fillGap = useCallback(async () => {
    if (!chatId || maxSeqRef.current == null) return;
    const { messages: gap } = await fetchMessengerMessages({
      chatId,
      afterSeq: maxSeqRef.current,
      limit: 50,
    });
    if (gap.length > 0) {
      await applyServerPage(gap, "merge");
    }
  }, [applyServerPage, chatId]);

  const ingestRealtimeInsert = useCallback(
    async (row: MessengerRealtimeRow) => {
      if (!chatId) return;
      if (row.deleted_at) {
        setServerRows((prev) => prev.filter((m) => m.id !== row.id));
        return;
      }
      if (detectSeqGap(maxSeqRef.current, row.seq)) {
        await fillGap();
        return;
      }
      try {
        const enriched = await fetchMessengerMessageById(chatId, row.id);
        await applyServerPage([enriched], "merge");
      } catch {
        await fillGap();
      }
    },
    [applyServerPage, chatId, fillGap],
  );

  const markTypingUser = useCallback((uid: string) => {
    setTypingUserIds((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
    window.setTimeout(() => {
      setTypingUserIds((prev) => prev.filter((id) => id !== uid));
    }, 4000);
  }, []);

  useMessengerRealtime(
    supabase,
    chatId,
    Boolean(chatId && user),
    {
      onMessageInsert: (row) => {
        if (row) void ingestRealtimeInsert(row);
      },
      onMessageUpdate: (row) => {
        if (row) void ingestRealtimeInsert(row);
      },
      onTyping: (p) => {
        if (p.userId !== user?.id) markTypingUser(p.userId);
      },
      onSubscribed: () => {
        setRealtimeReady(true);
        void fillGap();
      },
      onDisconnected: () => setRealtimeReady(false),
    },
    realtimeChannelRef,
  );

  useEffect(() => {
    queueMicrotask(() => void loadInitial());
  }, [loadInitial]);

  useEffect(() => {
    if (isOnline) void flushOutbox();
  }, [flushOutbox, isOnline]);

  useEffect(() => {
    if (merged.length > 0) void refreshAuthors(merged);
  }, [merged, refreshAuthors]);

  const send = useCallback(
    async (payload: {
      text: string;
      file: File | null;
      attachmentStoragePath?: string | null;
      attachmentMediaType?: "image" | "video" | null;
      localPreviewUrl?: string | null;
    }) => {
      if (!user?.id || !chatId) {
        toast.message("Нужна авторизация");
        return false;
      }

      const clientUuid = crypto.randomUUID();
      const body = payload.text.trim() || null;

      if (!body && !payload.attachmentStoragePath && !payload.file) return false;

      if (body) {
        const phi = detectPhi(body);
        if (!phi.ok) {
          toast.error(PHI_BLOCK_MESSAGE);
          return false;
        }
      }

      if (payload.file && !payload.attachmentStoragePath) {
        const fileCheck = await validateChatMediaUpload(payload.file);
        if (!fileCheck.ok) {
          toast.error(fileCheck.error);
          return false;
        }
      }

      if (payload.file && !payload.attachmentStoragePath && !isOnline) {
        toast.error("Без сети можно отправить только текст. Фото/видео — когда сеть вернётся.");
        if (!body) return false;
      }

      let attachmentStoragePath = payload.attachmentStoragePath ?? null;
      let attachmentMediaType = payload.attachmentMediaType ?? null;

      if (payload.file && isOnline && !attachmentStoragePath) {
        const uploadToast = toast.loading("Загрузка вложения…");
        try {
          const form = new FormData();
          form.append("scope", "channel");
          form.append("scopeId", legacyChannelId);
          form.append("file", payload.file);
          const uploadResponse = await fetch("/api/doctor-chat/media", { method: "POST", body: form });
          const uploaded = (await uploadResponse.json().catch(() => null)) as
            | {
                storagePath?: string;
                mediaType?: "image" | "video";
                metadataStripped?: boolean;
                error?: string;
              }
            | null;
          if (!uploadResponse.ok || !uploaded?.storagePath || !uploaded.mediaType) {
            toast.error(uploaded?.error ?? "Не удалось загрузить файл");
            return false;
          }
          attachmentStoragePath = uploaded.storagePath;
          attachmentMediaType = uploaded.mediaType;
          if (uploaded.metadataStripped) {
            toast.message("Метаданные снимка удалены (EXIF). Проверьте подписи на кадре.");
          }
        } finally {
          toast.dismiss(uploadToast);
        }
      }

      const entry: MessengerOutboxEntry = {
        clientUuid,
        chatId,
        legacyChannelId,
        body,
        attachmentStoragePath,
        attachmentMediaType,
        localPreviewUrl: payload.localPreviewUrl ?? null,
        status: "pending",
        createdAt: new Date().toISOString(),
        retryCount: 0,
        lastError: null,
      };

      await saveOutboxEntry(entry);
      setOutbox((prev) => [...prev.filter((e) => e.clientUuid !== clientUuid), entry]);

      if (isOnline) {
        await flushEntry(entry);
      } else {
        toast.message("Сохранено локально — отправится при появлении сети");
      }
      return true;
    },
    [chatId, flushEntry, isOnline, legacyChannelId, user?.id],
  );

  const retrySend = useCallback(
    async (clientUuid: string) => {
      const entry = outbox.find((e) => e.clientUuid === clientUuid);
      if (!entry) return;
      await flushEntry(entry);
    },
    [flushEntry, outbox],
  );

  const notifyTyping = useCallback(() => {
    if (!chatId || !user?.id) return;
    sendMessengerTypingBroadcast(realtimeChannelRef.current, chatId, user.id);
  }, [chatId, user?.id]);

  const loadOlderHistory = useCallback(async () => {
    if (!chatId || loadingOlder || !hasMoreHistory) return 0;
    const minSeq = serverRows[0]?.seq;
    if (minSeq == null) return 0;
    setLoadingOlder(true);
    try {
      const { messages: older, hasMore } = await fetchMessengerMessages({
        chatId,
        beforeSeq: minSeq,
        limit: 50,
      });
      if (older.length > 0) {
        await applyServerPage(older, "prepend");
        setHasMoreHistory(hasMore);
        if (user?.id) {
          await refreshAuthors(mergeMessengerMessages(older.map(dtoToServerRow), [], user.id));
        }
      } else {
        setHasMoreHistory(false);
      }
      return older.length;
    } finally {
      setLoadingOlder(false);
    }
  }, [
    applyServerPage,
    chatId,
    hasMoreHistory,
    loadingOlder,
    refreshAuthors,
    serverRows,
    user?.id,
  ]);

  const typingLabel = useMemo(() => {
    const others = typingUserIds.filter((id) => id !== user?.id);
    if (others.length === 0) return null;
    const first = authorNames[others[0]!] ?? "Коллега";
    return others.length === 1 ? `${first} печатает…` : "Несколько коллег печатают…";
  }, [authorNames, typingUserIds, user?.id]);

  return {
    chatId,
    messages,
    authorNames,
    authorTrust,
    loading,
    loadState,
    send,
    retrySend,
    notifyTyping,
    typingLabel,
    realtimeReady,
    userId: user?.id ?? null,
    hasMoreHistory,
    loadingOlder,
    loadOlderHistory,
  };
}
