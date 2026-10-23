"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { DoctorChatLoadPanel } from "@/components/chat/DoctorChatLoadPanel";
import { MessengerAiSuggestPanel } from "@/components/chat/messenger/MessengerAiSuggestPanel";
import { MessengerMessageTimeline } from "@/components/chat/messenger/MessengerMessageTimeline";
import { MessengerMediaDisclaimer } from "@/components/chat/messenger/MessengerMediaDisclaimer";
import { MessengerPushControls } from "@/components/chat/messenger/MessengerPushControls";
import { MessengerReportDialog } from "@/components/chat/messenger/MessengerReportDialog";
import { MessengerScrollToBottom } from "@/components/chat/messenger/MessengerScrollToBottom";
import { useMessengerListScroll } from "@/hooks/useMessengerListScroll";
import { useVisualViewportBottomInset } from "@/hooks/useVisualViewportBottomInset";
import { isDoctorChatAiMentionEnabledClient } from "@/lib/chat/flags";
import { fetchMessengerAiSuggest } from "@/lib/messenger/api-client";
import { parseMessengerAiMention } from "@/lib/messenger/ui/parse-ai-mention";
import { useMessengerChannel } from "@/lib/messenger/use-messenger-channel";
import { cn } from "@/lib/utils/cn";

type Props = {
  channelId: string;
  channelTitle: string;
  channelDescription?: string;
  /** Render inside split shell (no outer card chrome). */
  embedded?: boolean;
};

export function DoctorChannelChatV2({
  channelId,
  channelTitle,
  channelDescription,
  embedded = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef(0);
  const keyboardInset = useVisualViewportBottomInset();
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [insertDraft, setInsertDraft] = useState<string | null>(null);
  const [aiState, setAiState] = useState<{
    loading: boolean;
    suggestion: string | null;
    disclaimer: string | null;
    error: string | null;
  }>({ loading: false, suggestion: null, disclaimer: null, error: null });

  const {
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
    userId,
    hasMoreHistory,
    loadingOlder,
    loadOlderHistory,
  } = useMessengerChannel({ legacyChannelId: channelId });

  const { showJumpToBottom, unreadBelow, scrollToBottom, handleScroll } = useMessengerListScroll({
    scrollRef,
    messages,
    userId,
    hasMoreHistory,
    loadingOlder,
    loadOlderHistory,
  });

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    notifyTyping();
  };

  async function runAiSuggest(prompt: string) {
    if (!chatId) return;
    setAiState({ loading: true, suggestion: null, disclaimer: null, error: null });
    try {
      const { suggestion, disclaimer } = await fetchMessengerAiSuggest({ chatId, prompt });
      setAiState({ loading: false, suggestion, disclaimer, error: null });
    } catch (e) {
      setAiState({
        loading: false,
        suggestion: null,
        disclaimer: null,
        error: e instanceof Error ? e.message : "Не удалось получить подсказку",
      });
    }
  }

  const rootClass = cn(
    "doctor-chat-panel flex min-h-0 flex-1 flex-col",
    !embedded && "min-h-[520px] rounded-2xl border border-[var(--clinical-border)] shadow-sm",
  );

  return (
    <div className={rootClass}>
      <div className={cn("border-b border-[var(--clinical-border)] px-5 py-4", embedded && "hidden lg:block")}>
        <p className="text-sm font-black text-[var(--clinical-foreground)]">
          {channelTitle}
          <span className="ml-2 rounded-md bg-[var(--clinical-primary-muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
            Chat v2
          </span>
        </p>
        {channelDescription ? (
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{channelDescription}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-[var(--clinical-foreground-muted)]">
          Realtime{realtimeReady ? "" : " · подключение…"} · ссылка на кейс · @AI · жалоба
        </p>
        <MessengerPushControls channelId={channelId} className="mt-2" />
      </div>

      {typingLabel ? (
        <p className="border-b border-[var(--clinical-border)] px-4 py-1.5 text-xs text-[var(--clinical-foreground-muted)]">
          {typingLabel}
        </p>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {loadState ? (
          <div className="flex-1 p-4">
            <DoctorChatLoadPanel state={loadState} />
          </div>
        ) : loading && messages.length === 0 ? (
          <p className="p-4 text-sm text-[var(--clinical-foreground-muted)]">Загрузка сообщений…</p>
        ) : messages.length === 0 ? (
          <p className="p-4 text-sm text-[var(--clinical-foreground-muted)]">
            Напишите первым — текст уходит сразу, без PHI. Вставьте ссылку /cases/… или начните с @AI вопроса.
          </p>
        ) : (
          <MessengerMessageTimeline
            messages={messages}
            authorNames={authorNames}
            authorTrust={authorTrust}
            userId={userId}
            scrollRef={scrollRef}
            onScroll={() => void handleScroll()}
            loadingOlder={loadingOlder}
            onRetrySend={(uuid) => void retrySend(uuid)}
            onReportMessage={(messageId) => setReportMessageId(messageId)}
          />
        )}

        <MessengerScrollToBottom
          visible={showJumpToBottom && messages.length > 0}
          unreadCount={unreadBelow}
          onClick={() => scrollToBottom("smooth")}
        />
      </div>

      {!loadState && userId ? (
        <div
          className="doctor-chat-composer shrink-0 border-t border-[var(--clinical-border)] p-4"
          style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 16 : undefined }}
        >
          <MessengerMediaDisclaimer className="mb-2" />
          {isDoctorChatAiMentionEnabledClient() ? (
            <MessengerAiSuggestPanel
              loading={aiState.loading}
              suggestion={aiState.suggestion}
              disclaimer={aiState.disclaimer}
              error={aiState.error}
              onDismiss={() =>
                setAiState({ loading: false, suggestion: null, disclaimer: null, error: null })
              }
              onInsert={(text) => setInsertDraft(text)}
            />
          ) : null}
          <ChatMessageComposer
            busy={false}
            placeholder="Сообщение… /cases/uuid · @AI вопрос (учебный, без PHI)"
            insertDraft={insertDraft}
            onInsertDraftApplied={() => setInsertDraft(null)}
            onTyping={handleTyping}
            onSend={async ({ text, file }) => {
              const aiMention = parseMessengerAiMention(text);
              const textToSend = aiMention ? aiMention.bodyForSend : text;
              const preview = file ? URL.createObjectURL(file) : null;
              const ok = await send({
                text: textToSend,
                file,
                localPreviewUrl: preview,
              });
              if (ok) {
                requestAnimationFrame(() => scrollToBottom("smooth"));
                if (
                  aiMention &&
                  isDoctorChatAiMentionEnabledClient() &&
                  chatId
                ) {
                  void runAiSuggest(aiMention.prompt);
                }
              }
              return ok;
            }}
          />
        </div>
      ) : null}

      {chatId && reportMessageId ? (
        <MessengerReportDialog
          open
          chatId={chatId}
          messageId={reportMessageId}
          onClose={() => setReportMessageId(null)}
          onSubmitted={() => toast.success("Жалоба отправлена модераторам")}
        />
      ) : null}
    </div>
  );
}
