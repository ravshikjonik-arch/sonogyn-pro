"use client";

import { Bell, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  getWebPushVapidPublicKeyClient,
  isDoctorChatWebPushEnabledClient,
} from "@/lib/chat/flags";
import { registerDoctorChatWebPush } from "@/lib/pwa/doctor-chat-web-push";
import { cn } from "@/lib/utils/cn";

type Props = {
  channelId: string;
  className?: string;
};

export function MessengerPushControls({ channelId, className }: Props) {
  const [expoBusy, setExpoBusy] = useState(false);
  const [webBusy, setWebBusy] = useState(false);
  const [expoOn, setExpoOn] = useState(false);
  const webAvailable =
    isDoctorChatWebPushEnabledClient() && Boolean(getWebPushVapidPublicKeyClient());

  async function toggleExpoChannelPush() {
    setExpoBusy(true);
    try {
      const response = await fetch("/api/doctor-chat/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { subscribed?: boolean; error?: string }
        | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Не удалось изменить подписку");
        return;
      }
      const next = Boolean(payload?.subscribed);
      setExpoOn(next);
      toast.success(
        next
          ? "Expo push на канал включён (мобильное приложение)"
          : "Expo push на канал отключён",
      );
    } finally {
      setExpoBusy(false);
    }
  }

  async function enableWebPush() {
    setWebBusy(true);
    try {
      const result = await registerDoctorChatWebPush();
      if (result.ok) {
        toast.success("Web Push включён для этого браузера");
        return;
      }
      const messages: Record<string, string> = {
        unsupported: "Браузер не поддерживает Web Push",
        denied: "Разрешите уведомления в настройках браузера",
        no_vapid: "Web Push не настроен на сервере (VAPID)",
        disabled: "Web Push выключен флагом",
        failed: "Не удалось включить Web Push",
      };
      toast.message(messages[result.reason] ?? "Web Push недоступен");
    } finally {
      setWebBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        disabled={expoBusy}
        onClick={() => void toggleExpoChannelPush()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)] disabled:opacity-60"
      >
        <Smartphone className="h-3.5 w-3.5" aria-hidden />
        {expoOn ? "Expo · вкл" : "Expo push"}
      </button>
      {webAvailable ? (
        <button
          type="button"
          disabled={webBusy}
          onClick={() => void enableWebPush()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)] disabled:opacity-60"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden />
          Web Push
        </button>
      ) : null}
    </div>
  );
}
