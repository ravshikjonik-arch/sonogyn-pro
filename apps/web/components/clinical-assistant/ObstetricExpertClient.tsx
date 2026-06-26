"use client";

import { Brain, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fieldLabelClass =
  "mb-1.5 block text-sm font-medium text-[var(--clinical-foreground)]";

type CopilotResponse = {
  executiveSummaryRu: string;
  differential: Array<{ diagnosis: string; confidence: number; pathologyId: string }>;
  report: {
    briefConclusion: string;
    fullText: string;
    recommendations: string[];
    isuogDisclaimer: string;
  };
  protocol?: { completenessScore: number; nextActions: string[] };
  clinicalDecision?: { actions: Array<{ labelRu: string; priority: string; rationale: string }> };
  biometry?: { summaryRu: string };
  aneuploidy?: { riskLevel: string; summaryRu: string };
};

export function ObstetricExpertClient() {
  const [weeks, setWeeks] = useState("22");
  const [findings, setFindings] = useState("Вентрикуломегалия 13 мм\nОтсутствует CSP");
  const [lateralVentricle, setLateralVentricle] = useState("13");
  const [maternalAge, setMaternalAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResponse | null>(null);

  const runCopilot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const findingLines = findings
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const lv = lateralVentricle.trim() ? Number(lateralVentricle) : undefined;

      const res = await fetch("/api/ai/obstetric-expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestationalAge: { weeks: Number(weeks) || undefined },
          findings: findingLines,
          biometricData: lv ? { lateralVentricleMm: lv } : undefined,
          maternalAgeYears: maternalAge.trim() ? Number(maternalAge) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка запроса");
        return;
      }
      setResult(data as CopilotResponse);
    } catch {
      setError("Сеть недоступна");
    } finally {
      setLoading(false);
    }
  }, [findings, lateralVentricle, maternalAge, weeks]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ai/consultants/obstetrics">← Помощник акушера</Link>
        </Button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#0f766e] to-[#115e59] p-6 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            Woodward 4ed · ISUOG Expert System
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-black">Obstetric Expert Copilot</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">
          Дифференциал · биометрия · допплер · риск анеуплоидий · протокол · ISUOG-отчёт · CDS.
          Не чат — структурированный clinical engine.
        </p>
      </div>

      <ClinicalAssistStrip
        context={{
          title: "Obstetric Expert Copilot",
          mode: "obstetrics",
          voiceProfile: "fmf",
          ultrasoundFocus: ["дифференциал", "биометрия", "допплер", "ISUOG"],
        }}
        compact
      />

      <div className="sonogyn-glass-card space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="weeks" className={fieldLabelClass}>Срок (нед)</label>
            <Input id="weeks" value={weeks} onChange={(e) => setWeeks(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label htmlFor="lv" className={fieldLabelClass}>Atrium LV (mm)</label>
            <Input id="lv" value={lateralVentricle} onChange={(e) => setLateralVentricle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="age" className={fieldLabelClass}>Возраст матери (I трим.)</label>
            <Input id="age" value={maternalAge} onChange={(e) => setMaternalAge(e.target.value)} placeholder="опц." />
          </div>
        </div>
        <div>
          <label htmlFor="findings" className={fieldLabelClass}>Находки (по строке)</label>
          <Textarea
            id="findings"
            rows={4}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Вентрикуломегалия 13 мм&#10;Отсутствует CSP"
          />
        </div>
        <Button onClick={runCopilot} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Запустить copilot
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ai/consultants/fmf">FMF I трим. (сертиф. риск) →</Link>
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      {result ? (
        <div className="space-y-4">
          <section className="sonogyn-glass-card rounded-2xl p-5">
            <h2 className="text-sm font-bold">Executive summary</h2>
            <p className="mt-2 text-sm leading-relaxed">{result.executiveSummaryRu}</p>
          </section>

          {result.differential?.length ? (
            <section className="sonogyn-glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold">Дифференциал</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {result.differential.slice(0, 5).map((d) => (
                  <li key={d.pathologyId}>
                    • {d.diagnosis} — {Math.round(d.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.clinicalDecision?.actions?.length ? (
            <section className="sonogyn-glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold">Clinical Decision Support</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {result.clinicalDecision.actions.slice(0, 6).map((a, i) => (
                  <li key={i}>
                    <span className="font-medium">{a.labelRu}</span>
                    <span className="text-[var(--clinical-foreground-muted)]"> — {a.rationale}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="sonogyn-glass-card rounded-2xl p-5">
            <h2 className="text-sm font-bold">ISUOG-отчёт</h2>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-black/5 p-3 text-xs leading-relaxed dark:bg-white/5">
              {result.report.fullText}
            </pre>
            <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">{result.report.isuogDisclaimer}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
