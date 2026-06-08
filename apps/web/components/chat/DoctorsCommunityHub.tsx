"use client";

import { FolderOpen, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CaseFeed } from "@/components/cases/case-feed";
import { DoctorChannelChat } from "@/components/chat/DoctorChannelChat";
import { DoctorPresencePanel } from "@/components/chat/DoctorPresencePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOCTOR_CHAT_CHANNELS, type DoctorChatChannelSlug } from "@/lib/chat/constants";
import { cn } from "@/lib/utils/cn";

function HubInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "cases" ? "cases" : "chat";
  const initialChannel = (searchParams.get("channel") as DoctorChatChannelSlug) || "general";
  const [activeChannel, setActiveChannel] = useState<DoctorChatChannelSlug>(
    DOCTOR_CHAT_CHANNELS.some((c) => c.slug === initialChannel) ? initialChannel : "general",
  );

  const channel = DOCTOR_CHAT_CHANNELS.find((c) => c.slug === activeChannel) ?? DOCTOR_CHAT_CHANNELS[0]!;

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
        <div className="flex flex-wrap gap-2">
          {DOCTOR_CHAT_CHANNELS.map((ch) => (
            <button
              key={ch.slug}
              type="button"
              onClick={() => setActiveChannel(ch.slug)}
              className={cn(
                "rounded-xl border px-4 py-2 text-left text-sm transition",
                activeChannel === ch.slug
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
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
      </TabsContent>

      <TabsContent value="cases" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Структурированные кейсы с галереей снимков и тредом обсуждения.
          </p>
          <Button asChild size="sm">
            <Link href="/cases/new">Новый кейс</Link>
          </Button>
        </div>
        <CaseFeed />
      </TabsContent>
    </Tabs>
  );
}

export function DoctorsCommunityHub() {
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
              <Link href="/assistant">ИИ-помощник по снимку →</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Suspense fallback={<p className="text-sm text-slate-500">Загрузка…</p>}>
            <HubInner />
          </Suspense>
          <DoctorPresencePanel />
        </div>
      </div>
    </div>
  );
}
