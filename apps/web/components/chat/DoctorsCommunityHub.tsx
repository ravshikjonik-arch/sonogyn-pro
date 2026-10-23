"use client";

import { FolderOpen, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CaseFeed } from "@/components/cases/case-feed";
import { DoctorChannelChat } from "@/components/chat/DoctorChannelChat";
import { DoctorChannelChatV2Lazy } from "@/components/chat/DoctorChannelChatV2Lazy";
import { MessengerCommunityChatShell } from "@/components/chat/messenger/MessengerCommunityChatShell";
import { isDoctorChatV2EnabledClient } from "@/lib/chat/flags";
import { DoctorPresenceProvider } from "@/components/chat/DoctorPresenceContext";
import { DoctorPresencePanel } from "@/components/chat/DoctorPresencePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOCTOR_CHAT_CHANNELS, type DoctorChatChannelSlug } from "@/lib/chat/constants";
import { cn } from "@/lib/utils/cn";

function HubInner() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "cases" ||
    searchParams.get("lifecycle") ||
    searchParams.get("playlist") ||
    searchParams.get("knowledgeBase")
      ? "cases"
      : "chat";
  const caseTopic = searchParams.get("topic") === "prolapse" ? "prolapse" : "all";
  const initialPlaylistId = searchParams.get("playlist");
  const initialFeedMode =
    searchParams.get("feed") === "discussions" ? ("discussions" as const) : ("library" as const);
  const initialChannelId = searchParams.get("channelId") || null;
  const initialLifecycle = searchParams.get("lifecycle") || null;
  const initialKnowledgeBase =
    searchParams.get("knowledgeBase") === "1" || searchParams.get("knowledgeBase") === "true";
  const channelFromSlug = searchParams.get("channel") as DoctorChatChannelSlug | null;
  const channelFromId = initialChannelId
    ? DOCTOR_CHAT_CHANNELS.find((c) => c.id === initialChannelId)?.slug
    : null;
  const initialChannel =
    (channelFromSlug && DOCTOR_CHAT_CHANNELS.some((c) => c.slug === channelFromSlug)
      ? channelFromSlug
      : null) ??
    channelFromId ??
    "general";
  const [activeChannel, setActiveChannel] = useState<DoctorChatChannelSlug>(initialChannel);
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(initialChannelId || channelFromSlug));

  const channel = DOCTOR_CHAT_CHANNELS.find((c) => c.slug === activeChannel) ?? DOCTOR_CHAT_CHANNELS[0]!;
  const chatV2 = isDoctorChatV2EnabledClient();

  return (
    <Tabs defaultValue={initialTab} className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
          <MessageCircle className="h-4 w-4" />
          Чат врачей
        </TabsTrigger>
        <TabsTrigger value="cases" className="gap-1.5 text-xs sm:text-sm">
          <FolderOpen className="h-4 w-4" />
          Кейсы УЗИ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="space-y-4">
        {chatV2 ? (
          <MessengerCommunityChatShell
            channels={DOCTOR_CHAT_CHANNELS.map((ch) => ({
              slug: ch.slug,
              id: ch.id,
              title: ch.title,
              description: ch.description,
            }))}
            activeSlug={activeChannel}
            onSelectChannel={setActiveChannel}
            mobileChatOpen={mobileChatOpen}
            onMobileOpenChat={() => setMobileChatOpen(true)}
            onMobileBack={() => setMobileChatOpen(false)}
            chat={
              <DoctorChannelChatV2Lazy
                key={channel.id}
                channelId={channel.id}
                channelTitle={channel.title}
                channelDescription={channel.description}
                embedded
              />
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {DOCTOR_CHAT_CHANNELS.map((ch) => (
                <button
                  key={ch.slug}
                  type="button"
                  onClick={() => setActiveChannel(ch.slug)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-left text-sm transition text-[var(--clinical-foreground)]",
                    activeChannel === ch.slug
                      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold text-[var(--clinical-primary-deep)]"
                      : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
                  )}
                >
                  {ch.title}
                </button>
              ))}
            </div>
            <DoctorChannelChat
              channelId={channel.id}
              channelTitle={channel.title}
              channelDescription={channel.description}
            />
          </>
        )}
      </TabsContent>

      <TabsContent value="cases" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Структурированные кейсы с галереей снимков и тредом обсуждения.
          </p>
          <Button asChild size="sm">
            <Link
              href={
                initialFeedMode === "discussions" && initialChannelId
                  ? `/cases/new?feed=discussions&channelId=${initialChannelId}`
                  : initialFeedMode === "discussions"
                    ? "/cases/new?feed=discussions"
                    : "/cases/new"
              }
            >
              Новый кейс
            </Link>
          </Button>
        </div>
        <CaseFeed
          topic={caseTopic}
          initialFeedMode={initialFeedMode}
          initialChannelId={initialChannelId}
          initialLifecycle={initialLifecycle}
          initialKnowledgeBase={initialKnowledgeBase}
          initialPlaylistId={initialPlaylistId}
        />
      </TabsContent>
    </Tabs>
  );
}

export function DoctorsCommunityHub() {
  return (
    <DoctorPresenceProvider>
      <DoctorsCommunityHubBody />
    </DoctorPresenceProvider>
  );
}

function DoctorsCommunityHubBody() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="sonogyn-glass-card space-y-5 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-emerald-600">
              <MessageCircle className="h-3 w-3" />
              Live · Realtime
            </Badge>
            <Badge variant="outline">Сообщество врачей</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
            Чат врачей SonoGyn Pro
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Общайтесь с коллегами, прикрепляйте <strong>фото и видео УЗИ</strong> прямо в сообщениях,
            разбирайте кейсы. Только анонимизированные учебные материалы — без PHI.
          </p>
          <DoctorPresencePanel compact />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/cases/new">Новый кейс для разбора</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cases?tab=cases&topic=prolapse">Пролапс · разбор</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/calc/gyn/pop-q">POP-Q калькулятор</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/ai/consultants">ИИ-помощник по снимку →</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>}>
            <HubInner />
          </Suspense>
          <DoctorPresencePanel />
        </div>
      </div>
    </div>
  );
}
