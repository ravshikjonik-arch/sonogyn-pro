"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Clock,
  Command,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useProStatus } from "@/components/pro/use-pro-status";
import { onCopilotOpen } from "@/lib/ai/copilot-bus";
import { ChatCompletionRequestSchema, type ChatCompletionRequest, type ChatMessage } from "@repo/types";
import { FREE_AI_LIMIT, getAiUsage, incrementAiUsage } from "@/lib/pro/ai-usage";
import { openUpgrade } from "@/lib/pro/upgrade-bus";
import { cn } from "@/lib/utils/cn";

type Suggestion = { label: string; href: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  links?: Suggestion[];
  pro?: boolean;
  upsell?: boolean;
  stream?: boolean; // Indicate if message is streaming
};
type HistoryItem = { id: string; title: string; ts: number };

const HISTORY_KEY = "sonogyn-copilot-history";
const QUICK_COMMANDS: { label: string; prompt: string }[] = [
  { label: "Заключение по O-RADS 4", prompt: "Составь заключение по образованию яичника O-RADS 4." },
  { label: "Срок беременности по ПМП", prompt: "Рассчитай срок беременности и ПДР по дате последней менструации." },
  { label: "Протокол УЗИ ОМТ", prompt: "Сформируй протокол УЗИ органов малого таза." },
  { label: "Найти пациента", prompt: "Найди пациента по фамилии." },
  { label: "BI-RADS по описанию", prompt: "Помоги определить категорию BI-RADS по описанию." },
];

const ROUTES: { test: RegExp; reply: string; links: Suggestion[]; pro?: boolean }[] = [
  {
    test: /заключ|отч[её]т|report/i,
    reply:
      "Готов помочь с заключением. Откройте AI-рабочую зону — загрузите снимки и данные, я предложу формулировки. Полная авто-генерация заключения доступна на PRO.",
    links: [{ label: "AI-рабочая зона", href: "/workspace" }],
    pro: true,
  },
  {
    test: /пациент|иванов|карт/i,
    reply: "Поиск и карточки пациентов — в разделе «Пациенты». Там же история визитов и AI Summary.",
    links: [{ label: "Пациенты", href: "/patients" }],
  },
  {
    test: /o-?rads|орадс|яичник/i,
    reply: "Для классификации придатковых образований используйте калькулятор O-RADS (IOTA/ADNEX, по гайдлайнам).",
    links: [
      { label: "Калькулятор O-RADS", href: "/calculators/o-rads" },
      { label: "Макет яичника", href: "/ovary-atlas" },
    ],
  },
  {
    test: /срок|пдр|пмп|беремен|гестац/i,
    reply: "Срок беременности, ПДР, декрет — в модуле расчёта срока (ПМП, КТР, фетометрия, ЭКО).",
    links: [{ label: "Калькулятор срока", href: "/calculators/ob" }],
  },
  {
    test: /bi-?rads|молочн|мж/i,
    reply: "Категорию BI-RADS поможет определить калькулятор по УЗ-признакам.",
    links: [{ label: "Калькулятор BI-RADS", href: "/calculators/bi-rads" }],
  },
  {
    test: /протокол|омт|омп/i,
    reply: "Протоколы и маршруты — в «Помощнике врача»: нозология → анализы → УЗИ → лечение → протокол.",
    links: [{ label: "Помощник врача", href: "/assistant" }],
  },
];

function buildReply(prompt: string): Omit<Message, "id" | "role"> {
  const matched = ROUTES.find((r) => r.test.test(prompt));
  const base = matched ?? {
    reply:
      "Подскажу, какой модуль подойдёт. Уточните задачу: заключение, протокол, расчёт срока, классификация (O-RADS/BI-RADS/TI-RADS) или поиск пациента.",
    links: [
      { label: "Калькуляторы", href: "/calculators" },
      { label: "Пациенты", href: "/patients" },
    ] as Suggestion[],
    pro: false,
  };
  return {
    text: base.reply,
    links: base.links,
    pro: matched?.pro,
    upsell: base.upsell,
  };
}

export function SonogynCopilot() {
  const reduce = useReducedMotion();
  const { isPro } = useProStatus();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "history" | "commands">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pushHistory = useCallback((title: string) => {
    setHistory((prev) => {
      const next = [{ id: `h_${Date.now()}`, title: title.slice(0, 60), ts: Date.now() }, ...prev].slice(0, 30);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const prompt = raw.trim();
      if (!prompt) return;
      setTab("chat");
      const userMsg: Message = { id: `u_${Date.now()}`, role: "user", text: prompt };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      pushHistory(prompt);

      // Лимит бесплатных AI-запросов: вместо ошибки — красивый апселл.
      if (!isPro && getAiUsage() >= FREE_AI_LIMIT) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: "assistant",
            text: "Вы использовали все бесплатные AI-запросы. Переходите на PRO и продолжайте работу без ограничений — безлимитный AI, авто-заключения и анализ исследований.",
            upsell: true,
          },
        ]);
        openUpgrade({ feature: "Безлимитные AI-запросы" });
        return;
      }

      if (!isPro) incrementAiUsage();
      setTyping(true);
      const assistantMsg: Message = {
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: "",
        stream: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages.map((m) => ({ role: m.role, content: m.text })),
            model: "openai/gpt-4o-mini", // hardcode for now, can be dynamic later
            stream: true,
          }),
        });

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`);
      }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        // Stream the response
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta.content || "";
                fullText += delta;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === assistantMsg.id ? { ...msg, text: fullText } : msg)),
                );
              }
            }
          }
        }

        // Final message (non-streaming, could include links/PRO info)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id
              ? { ...msg, stream: false, ...buildReply(fullText) }
              : msg,
          ),
        );
      } catch (error) {
        console.error("AI Chat error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id
              ? { ...msg, text: "Произошла ошибка при получении ответа от AI.", stream: false }
              : msg,
          ),
        );
      } finally {
        setTyping(false);
      }
    },
    [pushHistory, reduce, isPro, messages],
  );

  useEffect(() => {
    return onCopilotOpen((detail) => {
      setOpen(true);
      if (detail.prompt) send(detail.prompt);
    });
  }, [send]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const empty = useMemo(() => messages.length === 0, [messages.length]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            type="button"
            onClick={() => setOpen(true)}
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.8 }}
            whileHover={reduce ? undefined : { y: -2 }}
            className="ai-gradient-bg fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(99,102,241,0.45)]"
            aria-label="Открыть Sonogyn AI"
          >
            <span className="ai-breathe flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4" />
            </span>
            Sonogyn AI
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] backdrop-blur-xl sm:w-[420px]"
              role="dialog"
              aria-label="Sonogyn AI Copilot"
            >
              <header className="flex items-center gap-3 border-b border-[var(--clinical-border)] px-4 py-3">
                <span className="ai-orb flex h-9 w-9 items-center justify-center rounded-xl text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--clinical-foreground)]">Sonogyn AI</p>
                  <p className="text-[11px] text-[var(--clinical-foreground-muted)]">Интеллектуальный помощник · preview</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-[var(--clinical-foreground-muted)] transition hover:bg-[var(--clinical-muted)]"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <nav className="flex gap-1 border-b border-[var(--clinical-border)] px-2 py-2">
                {([
                  { id: "chat", label: "Чат", icon: MessageSquare },
                  { id: "commands", label: "Команды", icon: Command },
                  { id: "history", label: "История", icon: Clock },
                ] as const).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                        tab === t.id
                          ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                          : "text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>

              {tab === "chat" && (
                <>
                  <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                    {empty && !typing && (
                      <div className="space-y-3 pt-6 text-center">
                        <span className="ai-orb ai-breathe mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                          <Sparkles className="h-6 w-6" />
                        </span>
                        <p className="text-sm font-semibold text-[var(--clinical-foreground)]">Чем помочь?</p>
                        <p className="mx-auto max-w-[260px] text-xs text-[var(--clinical-foreground-muted)]">
                          Спросите про заключение, протокол, срок беременности, O-RADS/BI-RADS или поиск пациента.
                        </p>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                            m.role === "user"
                              ? "ai-gradient-bg text-white"
                              : "border border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground)]",
                          )}
                        >
                          <p>{m.text}</p>
                          {m.links && m.links.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {m.links.map((l) => (
                                <Link
                                  key={l.href}
                                  href={l.href}
                                  onClick={() => setOpen(false)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-1 text-xs font-medium text-[var(--clinical-primary-deep)] transition hover:bg-[var(--clinical-muted)]"
                                >
                                  {l.label}
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              ))}
                            </div>
                          )}
                          {m.pro && (
                            <button
                              type="button"
                              onClick={() => openUpgrade({ feature: "Полная AI-генерация" })}
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--ai-gradient-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ai-violet)]"
                            >
                              <Lock className="h-3 w-3" />
                              Полная AI-генерация на PRO
                            </button>
                          )}
                          {m.upsell && (
                            <button
                              type="button"
                              onClick={() => openUpgrade({ feature: "Безлимитные AI-запросы" })}
                              className="ai-gradient-bg mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Перейти на PRO
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {typing && (
                      <div className="flex justify-start">
                        <div className="flex gap-1 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-3">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--clinical-foreground-muted)]"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[var(--clinical-border)] p-3">
                    <div className="flex items-end gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--clinical-ring)]">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send(input);
                          }
                        }}
                        rows={1}
                        placeholder="Спросите Sonogyn AI…"
                        className="max-h-28 flex-1 resize-none bg-transparent text-sm text-[var(--clinical-foreground)] outline-none placeholder:text-[var(--clinical-foreground-muted)]"
                      />
                      <button
                        type="button"
                        onClick={() => send(input)}
                        disabled={!input.trim()}
                        className="ai-gradient-bg flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition disabled:opacity-40"
                        aria-label="Отправить"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === "commands" && (
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                    Быстрые команды
                  </p>
                  {QUICK_COMMANDS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => send(c.prompt)}
                      className="flex w-full items-center gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2.5 text-left text-sm text-[var(--clinical-foreground)] transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-[var(--ai-indigo)]" />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {tab === "history" && (
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {history.length === 0 ? (
                    <p className="pt-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
                      История запросов пуста.
                    </p>
                  ) : (
                    history.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => send(h.title)}
                        className="flex w-full items-start gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2.5 text-left transition hover:bg-[var(--clinical-muted)]"
                      >
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--clinical-foreground-muted)]" />
                        <span className="text-sm text-[var(--clinical-foreground)]">{h.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
