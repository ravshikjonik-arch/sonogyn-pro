"use client";

import { Mic, MicOff, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BasicCourseLinkPanel } from "@/components/education/BasicCourseLinkPanel";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import {
  assistantCardHref,
  FMF_EARLY_ASSISTANT_HREF,
  getAssistantCards,
  obgynAssistantMeta,
  type ObgynAssistantMode,
} from "@/lib/clinical-assistant";
import { nosologyAssistContextForMode } from "@/lib/clinical-assistant/nosology-assist-context";

type Props = {
  mode: ObgynAssistantMode;
  initialQuery?: string;
  initialPatientId?: string;
};

export function ObgynAssistantClient({ mode, initialQuery = "", initialPatientId }: Props) {
  const cards = useMemo(() => getAssistantCards(mode), [mode]);
  const listAssistContext = useMemo(() => nosologyAssistContextForMode(mode), [mode]);
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.code, card.title, card.group, ...card.aliases].some((v) => v.toLowerCase().includes(q)),
    );
  }, [cards, query]);

  const startVoice = useCallback(() => {
    setVoiceError(null);
    const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    if (!SR) {
      setVoiceError("Голосовой поиск поддерживается в Chrome / Edge на десктопе.");
      return;
    }
    const rec = new SR();
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setQuery(text);
      setListening(false);
    };
    rec.onerror = () => {
      setVoiceError("Не удалось распознать речь. Повторите или введите текст.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start();
  }, []);

  const heroClass =
    mode === "gynecology" ? "from-[#831843] to-[#9d174d]" : "from-[#0f766e] to-[#115e59]";

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assistant">← Помощник врача</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/workspace">AI-зона УЗИ</Link>
          </Button>
        </div>

        <div className={`rounded-3xl bg-gradient-to-br ${heroClass} p-6 text-white shadow-xl sm:p-8`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {mode === "gynecology" ? "Помощник врача-гинеколога" : "Помощник акушера"} · SonoGyn Pro
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            {mode === "gynecology" ? "Помощник врача-гинеколога" : "Помощник акушера"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
            Выберите заболевание (МКБ) — откроется маршрут: приём → анализы → инструментально → УЗИ → лечение → протокол.
          </p>
        </div>

        <div className="sonogyn-glass-card rounded-2xl p-4 text-sm text-[var(--clinical-foreground-muted)]">
          <p className="font-bold text-[var(--clinical-foreground)]">Клинический маршрут</p>
          <p className="mt-1 leading-relaxed">{obgynAssistantMeta.architecture}</p>
          <p className="mt-2">
            Нозологий: {cards.length} · полных маршрутов:{" "}
            {cards.filter((c) => c.depth === "expanded").length}
          </p>
        </div>

        {mode === "obstetrics" ? (
          <div className="space-y-4">
            <div className="sonogyn-glass-card flex flex-col gap-3 rounded-2xl border border-teal-200/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-teal-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  <p className="text-sm font-bold text-[var(--clinical-foreground)]">FMF · малый срок и I скрининг</p>
                </div>
                <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                  До 11 нед. и первый скрининг 11+0–13+6: протокол, red flags, перенос КТР между вкладками.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href={FMF_EARLY_ASSISTANT_HREF}>Открыть FMF-модуль →</Link>
              </Button>
            </div>
            <BasicCourseLinkPanel variant="inline" />
          </div>
        ) : null}

        <ClinicalAssistStrip context={listAssistContext} compact />

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
            <Input
              className="pl-10"
              placeholder="МКБ или название: E28.2, миома, эндометриоз…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск нозологии"
            />
          </div>
          <Button
            type="button"
            variant={listening ? "default" : "outline"}
            className="gap-2"
            onClick={() => (listening ? null : startVoice())}
            disabled={listening}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? "Слушаю…" : "Голос"}
          </Button>
        </div>
        {voiceError ? <p className="text-xs text-amber-700">{voiceError}</p> : null}

        <p className="text-sm font-bold">Заболевания ({filtered.length})</p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Нажмите карточку — откроется полный маршрут. Зелёная метка «Полный» — развёрнутый маршрут по МКБ.
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => (
            <Link
              key={card.id}
              href={
                initialPatientId
                  ? `${assistantCardHref(mode, card.code)}?patientId=${encodeURIComponent(initialPatientId)}`
                  : assistantCardHref(mode, card.code)
              }
              prefetch
              className="flex flex-col gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-left transition hover:border-[var(--clinical-primary)] hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-black text-amber-900">
                  {card.code}
                </span>
                {card.depth === "expanded" ? (
                  <Badge className="shrink-0 bg-emerald-600 text-[10px]">Полный</Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Базовый
                  </Badge>
                )}
              </div>
              <span className="text-sm font-bold leading-snug">{card.title}</span>
              <span className="text-xs text-[var(--clinical-foreground-muted)]">{card.group}</span>
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--clinical-foreground-muted)]">Ничего не найдено.</p>
        ) : null}
      </div>
    </>
  );
}
