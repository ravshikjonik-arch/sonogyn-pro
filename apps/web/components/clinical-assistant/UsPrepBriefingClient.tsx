"use client";

import { AlertTriangle, Copy, Mic, Square, Shield } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechDictation } from "@repo/clinical-speech/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DOCTOR_VISIT_ROLE_LABELS,
  type DoctorVisitRole,
  type UsPrepBriefingResult,
  type UsPrepDomain,
} from "@/lib/ai/us-prep-briefing";
import { cn } from "@/lib/utils/cn";

type ApiOk = { result: UsPrepBriefingResult };
type ApiErr = { error?: string; message?: string };

const ROLE_OPTIONS: { value: DoctorVisitRole; label: string; hint: string }[] = [
  { value: "obgyn", label: "Акушер-гинеколог", hint: "Осмотр, анализы, маршрут · без полного УЗИ-чеклиста" },
  { value: "us", label: "Врач УЗИ", hint: "Вопросы к ответу на исследовании · без назначений" },
  { value: "obgyn_us", label: "АГ с правом УЗИ", hint: "Клиника + УЗИ в одном чеклисте" },
];

const DOMAIN_OPTIONS: { value: UsPrepDomain; label: string }[] = [
  { value: "both", label: "АГи · оба" },
  { value: "gynecology", label: "Гинекология" },
  { value: "obstetrics", label: "Акушерство" },
];

const ROLE_STORAGE_KEY = "sonogyn:us-prep-role";
const BRIEF_DEBOUNCE_MS = 1200;
const MIN_CHARS_FOR_BRIEF = 8;

function Section({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "danger" | "focus";
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        tone === "danger" && "border-rose-300/60 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40",
        tone === "focus" && "border-emerald-400/50 bg-emerald-500/10",
        tone === "default" && "border-[var(--clinical-border)] bg-[var(--clinical-card)]",
      )}
    >
      <h2 className="text-sm font-semibold text-[var(--clinical-foreground)]">{title}</h2>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

export function UsPrepBriefingClient() {
  const [visitContext, setVisitContext] = useState("");
  const [domain, setDomain] = useState<UsPrepDomain>("both");
  const [role, setRole] = useState<DoctorVisitRole>("obgyn_us");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<UsPrepBriefingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastBriefKeyRef = useRef("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ROLE_STORAGE_KEY) as DoctorVisitRole | null;
      if (saved && saved in DOCTOR_VISIT_ROLE_LABELS) setRole(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function selectRole(next: DoctorVisitRole) {
    setRole(next);
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    lastBriefKeyRef.current = "";
  }

  const speech = useSpeechDictation({
    lang: "ru-RU",
    continuous: true,
    interimResults: true,
    // Prefer on-device Web Speech; auto falls back to server STT if Web Speech missing (Safari).
    engineMode: "auto",
    enableMicLevel: true,
    draftKey: "sonogyn:us-prep-live",
  });

  const liveText = [speech.transcript, speech.interim].filter(Boolean).join(" ").trim();

  const refreshBriefing = useCallback(
    async (complaints: string) => {
      const key = `${role}|${domain}|${visitContext}|${complaints}`;
      if (complaints.trim().length < MIN_CHARS_FOR_BRIEF) return;
      if (key === lastBriefKeyRef.current) return;
      lastBriefKeyRef.current = key;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setApiError(null);
      try {
        const res = await fetch("/api/ai/us-prep-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            complaints,
            domain,
            role,
            visitContext: visitContext.trim() || undefined,
          }),
        });
        const data = (await res.json()) as ApiOk & ApiErr;
        if (!res.ok) {
          setApiError(data.error ?? data.message ?? "Не удалось обновить чеклист.");
          return;
        }
        setResult(data.result);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setApiError("Сеть недоступна — чеклист не обновился.");
      } finally {
        setLoading(false);
      }
    },
    [domain, role, visitContext],
  );

  useEffect(() => {
    if (!speech.listening && !speech.transcript.trim()) return;
    const source = liveText || speech.transcript;
    if (source.trim().length < MIN_CHARS_FOR_BRIEF) return;
    const t = window.setTimeout(() => {
      void refreshBriefing(source);
    }, BRIEF_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [liveText, speech.listening, speech.transcript, refreshBriefing]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  async function toggleSession() {
    setApiError(null);
    if (speech.listening) {
      speech.stop();
      if (speech.transcript.trim().length >= MIN_CHARS_FOR_BRIEF) {
        await refreshBriefing(speech.transcript);
      }
      return;
    }
    await speech.start();
  }

  async function copyDoctorBrief() {
    if (!result) return;
    const text = [
      "=== ТОЛЬКО ДЛЯ ВРАЧА · ПАЦИЕНТКЕ НЕ ПОКАЗЫВАТЬ ===",
      `Роль: ${result.roleLabelRu}`,
      result.titleRu,
      "",
      speech.transcript || result.complaintSummaryRu,
      "",
      "СЕЙЧАС:",
      ...result.primaryChecklistRu.map((q, i) => `${i + 1}. ${q}`),
      result.clinicalChecklistRu.length
        ? `\nКлиника (АГ):\n${result.clinicalChecklistRu.map((q) => `• ${q}`).join("\n")}`
        : "",
      result.ultrasoundQuestionsRu.length
        ? `\nУЗИ — ответить:\n${result.ultrasoundQuestionsRu.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
        : "",
      result.labsAndSmearsRu.length
        ? `\nАнализы / мазки:\n${result.labsAndSmearsRu.map((q) => `• ${q}`).join("\n")}`
        : "",
      result.redFlagsRu.length
        ? `\nКрасные флаги:\n${result.redFlagsRu.map((q) => `⚠ ${q}`).join("\n")}`
        : "",
      "",
      result.disclaimerRu,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setApiError("Не удалось скопировать.");
    }
  }

  const micLevelPct = Math.min(100, Math.round((speech.level || 0) * 100));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ai/consultants">← Помощник врача</Link>
        </Button>
        <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-800 dark:text-amber-200">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          Только врач · пациентка не видит
        </Badge>
      </div>

      <header className="space-y-3 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Live visit · роль врача</p>
        <h1 className="text-2xl font-black sm:text-3xl">Слушаю жалобы → чеклист под вашу роль</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/85">
          Платформа общая. Выберите, кто вы на приёме: АГ, врач УЗИ или АГ с правом УЗИ — чеклист будет разный и
          короткий, по тому что говорит пациентка.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 sm:p-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
            Моя роль на приёме
          </p>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Роль врача">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={role === opt.value}
                disabled={speech.listening}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
                  role === opt.value
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-[var(--clinical-border)]",
                )}
                onClick={() => selectRole(opt.value)}
              >
                <span className="block text-sm font-semibold text-[var(--clinical-foreground)]">{opt.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-[var(--clinical-foreground-muted)]">
                  {opt.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Профиль">
          {DOMAIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={domain === opt.value}
              disabled={speech.listening}
              className={cn(
                "h-10 rounded-xl border px-3 text-sm font-medium disabled:opacity-60",
                domain === opt.value
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
              )}
              onClick={() => {
                setDomain(opt.value);
                lastBriefKeyRef.current = "";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          className={cn("h-16 w-full gap-3 text-base", speech.listening && "bg-rose-500 text-white hover:bg-rose-400")}
          onClick={() => void toggleSession()}
          disabled={!speech.supported && !speech.listening}
          aria-pressed={speech.listening}
        >
          {speech.listening ? <Square className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
          {speech.listening ? "Стоп · обновить чеклист" : "Включить · слушать приём"}
        </Button>

        {!speech.supported ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
            Голосовой ввод недоступен в этом браузере. Откройте Chrome или Edge по HTTPS (sonogyn-pro.ru) и
            разрешите микрофон.
          </p>
        ) : null}

        {speech.listening ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-[var(--clinical-foreground-muted)]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                ● Слушаю · роль: {DOCTOR_VISIT_ROLE_LABELS[role]}
              </span>
              <span>{loading ? "Обновляю…" : "Чеклист по ходу речи"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-100"
                style={{ width: `${Math.max(8, micLevelPct)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--clinical-foreground-muted)]">
            Что говорит пациентка (можно править)
          </label>
          <Textarea
            value={
              speech.listening
                ? `${speech.transcript}${speech.interim ? ` ${speech.interim}` : ""}`
                : speech.transcript
            }
            onChange={(e) => speech.setTranscript(e.target.value)}
            placeholder="Жалобы появятся при записи…"
            className="min-h-28"
            readOnly={speech.listening}
          />
        </div>

        <Textarea
          value={visitContext}
          onChange={(e) => {
            setVisitContext(e.target.value);
            lastBriefKeyRef.current = "";
          }}
          placeholder="Контекст визита (опционально)"
          className="min-h-14"
          disabled={speech.listening}
        />

        {(apiError || speech.error) && (
          <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
            {apiError || speech.error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={speech.transcript.trim().length < MIN_CHARS_FOR_BRIEF || loading}
            onClick={() => {
              lastBriefKeyRef.current = "";
              void refreshBriefing(speech.transcript);
            }}
          >
            Обновить чеклист
          </Button>
          <Button type="button" variant="ghost" className="h-11" onClick={() => speech.reset()} disabled={speech.listening}>
            Очистить
          </Button>
        </div>
      </div>

      {result ? (
        <div className="space-y-4" data-audience="doctor_only" data-patient-visible="false">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                {result.roleLabelRu} · не для пациентки
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--clinical-foreground)]">{result.titleRu}</h2>
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{result.complaintSummaryRu}</p>
            </div>
            <Button type="button" variant="outline" className="h-11 gap-2" onClick={() => void copyDoctorBrief()}>
              <Copy className="h-4 w-4" aria-hidden />
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>

          <Section title="Сейчас (главный чеклист)" items={result.primaryChecklistRu} tone="focus" />
          <Section title="Клиника · АГ" items={result.clinicalChecklistRu} />
          <Section title="УЗИ — ответить в протоколе" items={result.ultrasoundQuestionsRu} />
          <Section title="На что обратить внимание" items={result.attentionPointsRu} />
          <Section title="Анализы / мазки" items={result.labsAndSmearsRu} />
          <Section title="Маршрутизация / КР" items={result.treatmentContextRu} />
          <Section title="Красные флаги" items={result.redFlagsRu} tone="danger" />

          {result.suggestedModules.length > 0 ? (
            <section className="flex flex-wrap gap-2">
              {result.suggestedModules.map((m) => (
                <Button key={m.href} variant="outline" size="sm" asChild>
                  <Link href={m.href}>{m.label}</Link>
                </Button>
              ))}
            </section>
          ) : null}

          <p className="flex gap-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            {result.disclaimerRu}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
          Выберите роль → включите микрофон → после фраз жалоб появится короткий чеклист под вашу роль.
        </p>
      )}
    </div>
  );
}
