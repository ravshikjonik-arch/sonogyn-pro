"use client";

import { useState } from "react";
import { Bell, Mail, MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type NotifyStudentsPanelProps = {
  courseId: string;
};

export function NotifyStudentsPanel({ courseId }: NotifyStudentsPanelProps) {
  const [subject, setSubject] = useState("Напоминание о лекции");
  const [message, setMessage] = useState("Здравствуйте! Напоминаем о предстоящей офлайн-лекции.");
  const [channels, setChannels] = useState({ email: true, sms: false, telegram: false });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  async function send() {
    setSending(true);
    setResult("");
    const res = await fetch(`/api/author/courses/${courseId}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ subject, message, channels }),
    });
    const body = (await res.json()) as {
      ok?: boolean;
      result?: {
        email: { sent: number; failed: number; skipped: number };
        sms: { sent: number; failed: number; skipped: number };
        telegram: { sent: number; failed: number; skipped: number };
      };
      error?: string;
    };
    setSending(false);
    if (!res.ok || !body.ok || !body.result) {
      setResult(body.error ?? "Ошибка отправки");
      return;
    }
    const r = body.result;
    setResult(
      `Email: ${r.email.sent}/${r.email.failed}/${r.email.skipped} · SMS: ${r.sms.sent}/${r.sms.failed}/${r.sms.skipped} · Telegram: ${r.telegram.sent}/${r.telegram.failed}/${r.telegram.skipped}`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Уведомления студентам
        </CardTitle>
        <CardDescription>Email (Resend), SMS (sms.ru), Telegram Bot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Тема"
        />
        <textarea
          className="min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Текст сообщения"
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={channels.email}
              onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))}
            />
            <Mail className="h-4 w-4" />
            Email
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={channels.sms}
              onChange={(e) => setChannels((c) => ({ ...c, sms: e.target.checked }))}
            />
            <MessageSquare className="h-4 w-4" />
            SMS
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={channels.telegram}
              onChange={(e) => setChannels((c) => ({ ...c, telegram: e.target.checked }))}
            />
            <Send className="h-4 w-4" />
            Telegram
          </label>
        </div>
        <Button size="sm" className="w-full" onClick={() => void send()} disabled={sending}>
          {sending ? "Отправка…" : "Отправить всем студентам курса"}
        </Button>
        {result ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{result}</p> : null}
      </CardContent>
    </Card>
  );
}
