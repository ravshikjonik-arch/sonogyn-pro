"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  GraduationCap,
  MessageSquare,
} from "lucide-react";

import { CervixPathologySelfAssessmentWidget } from "@/components/education/CervixPathologySelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { openCopilot } from "@/lib/ai/copilot-bus";
import { cn } from "@/lib/utils/cn";
import {
  getCytologyAnatomyNodes,
  getCytologyBethesdaCategories,
  getCytologyClinicalAlgorithms,
  getCytologyClinicalCases,
  getCytologyCoTestingMatrix,
  getCytologyConventional,
  getCytologyDashboardTopics,
  getCytologyHpvEducation,
  getCytologyHpvTesting,
  getCytologyLiquidCompare,
  getCytologyLectureSlides,
  getCytologyModuleMeta,
  getCytologySamplingErrors,
  getCytologySamplingProtocol,
  getCytologyTimeline,
  interpretBethesdaAssist,
  recommendCytologyScreening,
  type CytologyBethesdaCode,
  type CytologyHpvStatus,
  type CytologyTopicId,
} from "@repo/cervix-pathology-reference";

const meta = getCytologyModuleMeta();
const topics = getCytologyDashboardTopics();

const AGE_MIN = 14;
const AGE_MAX = 90;

function parseAgeInput(raw: string, fallback: number): number {
  if (raw.trim() === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) return fallback;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(n)));
}

function RiskBadge({ level }: { level: "low" | "moderate" | "high" | "critical" }) {
  const map = {
    low: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    moderate: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    high: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    critical: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  };
  const label = { low: "Низкий", moderate: "Умеренный", high: "Высокий", critical: "Критический" }[level];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", map[level])}>{label}</span>;
}

function SectionCard({ title, children, summary }: { title: string; summary?: string; children: ReactNode }) {
  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {summary ? <CardDescription>{summary}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function AskAiButton({ prompt }: { prompt: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => openCopilot({ prompt, command: "cytology" })}>
      <Bot className="mr-1 h-4 w-4" />
      Спросить AI
    </Button>
  );
}

function ScreeningWizard() {
  const [age, setAge] = useState(35);
  const [cytology, setCytology] = useState<CytologyBethesdaCode | "">("");
  const [hpv, setHpv] = useState<CytologyHpvStatus>("unknown");
  const [pregnant, setPregnant] = useState(false);
  const [hiv, setHiv] = useState(false);
  const [priorExcision, setPriorExcision] = useState(false);

  const result = useMemo(
    () =>
      recommendCytologyScreening({
        age,
        cytology: cytology || null,
        hpvStatus: hpv,
        pregnant,
        hivPositive: hiv,
        priorExcision,
      }),
    [age, cytology, hpv, pregnant, hiv, priorExcision],
  );

  return (
    <SectionCard title="Алгоритм скрининга РШМ">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">Возраст</label>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(parseAgeInput(e.target.value, age))}
            min={AGE_MIN}
            max={AGE_MAX}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Цитология</label>
          <select
            className="w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2 text-sm"
            value={cytology}
            onChange={(e) => setCytology(e.target.value as CytologyBethesdaCode | "")}
          >
            <option value="">Не указано</option>
            {(["nilm", "asc-us", "lsil", "hsil", "agc", "unsatisfactory"] as const).map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold">HPV</label>
          <select
            className="w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2 text-sm"
            value={hpv}
            onChange={(e) => setHpv(e.target.value as CytologyHpvStatus)}
          >
            <option value="unknown">Неизвестно</option>
            <option value="negative">Отрицательный</option>
            <option value="positive">Положительный</option>
            <option value="16-positive">HPV 16+</option>
            <option value="18-positive">HPV 18+</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} /> Беременность
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hiv} onChange={(e) => setHiv(e.target.checked)} /> ВИЧ
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={priorExcision} onChange={(e) => setPriorExcision(e.target.checked)} /> После конизации
        </label>
      </div>
      <div className="rounded-xl border border-[var(--clinical-border)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold">{result.summary}</h4>
          <RiskBadge level={result.riskLevel} />
        </div>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {result.actionsNow.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {result.nextScreeningMonths ? (
          <p className="mt-2 text-sm">Следующий скрининг: ~{result.nextScreeningMonths} мес.</p>
        ) : null}
        <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">{result.disclaimer}</p>
      </div>
    </SectionCard>
  );
}

function BethesdaAiPanel() {
  const [age, setAge] = useState(32);
  const [cytology, setCytology] = useState<CytologyBethesdaCode>("asc-us");
  const [hpv, setHpv] = useState<CytologyHpvStatus>("positive");
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<ReturnType<typeof interpretBethesdaAssist> | null>(null);

  const localResult = useMemo(
    () => interpretBethesdaAssist({ age, cytology, hpvStatus: hpv }),
    [age, cytology, hpv],
  );

  const runAssist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/education/cytology/bethesda-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, cytology, hpvStatus: hpv }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiResult(data.result);
      } else setApiResult(localResult);
    } catch {
      setApiResult(localResult);
    } finally {
      setLoading(false);
    }
  }, [age, cytology, hpv, localResult]);

  const result = apiResult ?? localResult;

  return (
    <SectionCard title="AI-консультант Bethesda" summary="Без ФИО. Только обезличенные поля.">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950/30">
        Не вводите персональные данные. Educational / decision support only.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold">Возраст</label>
          <Input type="number" value={age} onChange={(e) => setAge(parseAgeInput(e.target.value, age))} min={AGE_MIN} max={AGE_MAX} />
        </div>
        <div>
          <label className="block text-sm font-semibold">Цитология</label>
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={cytology}
            onChange={(e) => setCytology(e.target.value as CytologyBethesdaCode)}
          >
            {(["nilm", "asc-us", "lsil", "hsil", "agc", "unsatisfactory"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold">HPV</label>
          <select className="w-full rounded-md border p-2 text-sm" value={hpv} onChange={(e) => setHpv(e.target.value as CytologyHpvStatus)}>
            <option value="negative">−</option>
            <option value="positive">+</option>
            <option value="16-positive">16+</option>
          </select>
        </div>
      </div>
      <Button type="button" onClick={runAssist} disabled={loading}>
        {loading ? "…" : "Интерпретировать"}
      </Button>
      <div className="space-y-2 text-sm">
        <RiskBadge level={result.riskLevel === "critical" ? "critical" : result.riskLevel} />
        <p>{result.interpretation}</p>
        <ul className="list-disc pl-5">{result.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
        <p>
          <strong>Пациентке:</strong> {result.explainToPatient}
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.disclaimer}</p>
      </div>
      <AskAiButton prompt={`Bethesda ${cytology}, HPV ${hpv}, возраст ${age}. Тактика?`} />
    </SectionCard>
  );
}

function ClinicalCasesPanel() {
  const cases = getCytologyClinicalCases();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const c = cases[idx];
  if (!c) return null;

  return (
    <SectionCard title="Клинические кейсы">
      <div className="flex flex-wrap gap-2">
        {cases.map((item, i) => (
          <Button key={item.id} size="sm" variant={i === idx ? "default" : "outline"} onClick={() => { setIdx(i); setPicked(null); }}>
            {i + 1}
          </Button>
        ))}
      </div>
      <p className="font-semibold">{c.title}</p>
      <p className="text-sm">{c.question}</p>
      <div className="space-y-2">
        {c.options.map((opt, i) => (
          <Button
            key={opt}
            type="button"
            variant={picked === i ? (i === c.correctIndex ? "default" : "destructive") : "outline"}
            className="h-auto w-full justify-start whitespace-normal text-left"
            onClick={() => setPicked(i)}
          >
            {opt}
          </Button>
        ))}
      </div>
      {picked !== null ? <p className="rounded-lg bg-[var(--clinical-muted)] p-3 text-sm">{c.explanation}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/cases/new?channel=${c.casesChannel}`}>
            <MessageSquare className="mr-1 h-4 w-4" />
            Обсудить в Cases
          </Link>
        </Button>
        <AskAiButton prompt={`Кейс: ${c.title}`} />
      </div>
    </SectionCard>
  );
}

function TopicContent({ topicId }: { topicId: CytologyTopicId }) {
  const [anatomySel, setAnatomySel] = useState(getCytologyAnatomyNodes()[0]?.id ?? "");
  const [bethesdaSel, setBethesdaSel] = useState(getCytologyBethesdaCategories()[0]?.id ?? "");
  const [lecIdx, setLecIdx] = useState(0);
  const [slide, setSlide] = useState(0);

  switch (topicId) {
    case "anatomy": {
      const nodes = getCytologyAnatomyNodes();
      const node = nodes.find((n) => n.id === anatomySel) ?? nodes[0];
      return (
        <SectionCard title="Анатомия шейки матки">
          <div className="flex flex-wrap gap-2">
            {nodes.map((n) => (
              <Button key={n.id} size="sm" variant={n.id === anatomySel ? "default" : "outline"} onClick={() => setAnatomySel(n.id)}>
                {n.label}
              </Button>
            ))}
          </div>
          {node ? (
            <div className="space-y-2 rounded-xl border p-4 text-sm">
              <p>{node.description}</p>
              <p>{node.clinicalSignificance}</p>
              <p className="rounded-lg bg-[var(--clinical-muted)] p-3">
                <GraduationCap className="mr-1 inline h-4 w-4" />
                {node.plainLanguage}
              </p>
              <AskAiButton prompt={`Объясни проще: ${node.label}`} />
            </div>
          ) : null}
        </SectionCard>
      );
    }
    case "transformation-zone": {
      const tl = getCytologyTimeline();
      return (
        <SectionCard title={tl.title}>
          <ol className="space-y-2 border-l-2 border-[var(--clinical-primary)] pl-4 text-sm">
            {tl.steps.map((s) => (
              <li key={s.id}>
                <strong>{s.label}</strong> — {s.description}
              </li>
            ))}
          </ol>
        </SectionCard>
      );
    }
    case "hpv": {
      const hpv = getCytologyHpvEducation();
      return (
        <SectionCard title={hpv.title}>
          {hpv.stats.map((st) => (
            <div key={st.label} className="inline-block rounded-xl bg-[var(--clinical-muted)] p-3 text-center mr-2">
              <p className="text-xl font-bold">{st.value}</p>
              <p className="text-xs">{st.label}</p>
            </div>
          ))}
        </SectionCard>
      );
    }
    case "screening":
      return <ScreeningWizard />;
    case "liquid-cytology": {
      const liq = getCytologyLiquidCompare();
      return (
        <SectionCard title="ThinPrep vs SurePath">
          {liq.systems.map((s) => (
            <div key={s.id} className="rounded-xl border p-3 text-sm">
              <p className="font-bold">{s.name}</p>
              <p>Объём: {s.volumeMl} ml · Адекватность: ≥{s.adequacyMinCells} клеток</p>
            </div>
          ))}
        </SectionCard>
      );
    }
    case "conventional": {
      const conv = getCytologyConventional();
      return (
        <SectionCard title="Цитология на стекло">
          <ul className="list-disc pl-5 text-sm">{conv.techniqueChecklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </SectionCard>
      );
    }
    case "sampling": {
      const sp = getCytologySamplingProtocol();
      return (
        <SectionCard title="Забор материала">
          <ol className="list-decimal pl-5 text-sm">
            {sp.steps.map((s) => (
              <li key={s.order}>
                {s.title}: {s.body}
              </li>
            ))}
          </ol>
        </SectionCard>
      );
    }
    case "sampling-errors":
      return (
        <SectionCard title="Ошибки">
          <div className="grid gap-2 md:grid-cols-2">
            {getCytologySamplingErrors().map((e) => (
              <div key={e.id} className="rounded border p-2 text-sm">
                <strong>{e.title}</strong>
                <p>{e.fix}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      );
    case "bethesda": {
      const cats = getCytologyBethesdaCategories();
      const cat = cats.find((c) => c.id === bethesdaSel);
      return (
        <SectionCard title="Bethesda">
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Button key={c.id} size="sm" variant={c.id === bethesdaSel ? "default" : "outline"} onClick={() => setBethesdaSel(c.id)}>
                {c.code}
              </Button>
            ))}
          </div>
          {cat ? <p className="text-sm">{cat.doctorAction}</p> : null}
        </SectionCard>
      );
    }
    case "hpv-testing":
      return (
        <SectionCard title="ВПЧ-тест">
          {getCytologyHpvTesting().sections.map((s) => (
            <p key={s.id} className="text-sm">
              <strong>{s.title}:</strong> {s.body}
            </p>
          ))}
        </SectionCard>
      );
    case "co-testing": {
      const matrix = getCytologyCoTestingMatrix();
      return (
        <SectionCard title={matrix.title}>
          {matrix.rows.map((r, i) => (
            <p key={i} className="text-sm">
              {r.cytology} / {r.hpv} → {r.action}
            </p>
          ))}
        </SectionCard>
      );
    }
    case "algorithms": {
      const alg = getCytologyClinicalAlgorithms();
      return (
        <SectionCard title="Цепочка диагностики">
          <div className="flex flex-wrap gap-2">
            {alg.chain.map((c, i) => (
              <span key={c.step} className="flex items-center gap-1">
                <Badge variant="outline">{c.label}</Badge>
                {i < alg.chain.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}
              </span>
            ))}
          </div>
          <Button asChild size="sm">
            <Link href={alg.links.colposcopy}>Кольпоскопия</Link>
          </Button>
        </SectionCard>
      );
    }
    case "cases":
      return <ClinicalCasesPanel />;
    case "quiz":
      return (
        <SectionCard title="Самопроверка">
          <CervixPathologySelfAssessmentWidget />
        </SectionCard>
      );
    case "ai-assist":
      return <BethesdaAiPanel />;
    case "lecture": {
      const lec = getCytologyLectureSlides();
      const lecture = lec.lectures[lecIdx];
      return (
        <SectionCard title="Лекция">
          <div className="flex flex-wrap gap-2">
            {lec.lectures.map((l, i) => (
              <Button key={l.id} size="sm" variant={i === lecIdx ? "default" : "outline"} onClick={() => { setLecIdx(i); setSlide(0); }}>
                {l.title}
              </Button>
            ))}
          </div>
          {lecture ? (
            <div className="rounded-xl bg-[var(--clinical-muted)] p-8 text-center">
              <p className="text-xl font-bold">{lecture.slides[slide]}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" disabled={slide <= 0} onClick={() => setSlide((s) => s - 1)}>
              Назад
            </Button>
            <Button type="button" disabled={!lecture || slide >= (lecture?.slides.length ?? 1) - 1} onClick={() => setSlide((s) => s + 1)}>
              Вперёд
            </Button>
          </div>
        </SectionCard>
      );
    }
    default:
      return null;
  }
}

type Props = { initialTopic?: CytologyTopicId };

export function CervixCytologyScreeningClient({ initialTopic }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState<CytologyTopicId | null>(initialTopic ?? null);

  useEffect(() => {
    setTopic(initialTopic ?? null);
  }, [initialTopic]);

  const navigateTopic = useCallback(
    (next: CytologyTopicId | null) => {
      setTopic(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "cytology");
      if (next) params.set("topic", next);
      else params.delete("topic");
      router.replace(`/tools/refs/cervix-pathology?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (!topic) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Badge variant="outline">Глава 8</Badge>
          <h2 className="text-2xl font-bold">{meta.title}</h2>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">{meta.disclaimer}</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigateTopic(t.id)}
              className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-left hover:border-[var(--clinical-primary)]"
            >
              <p className="font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{t.summary}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => navigateTopic(null)}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        К dashboard
      </Button>
      <TopicContent topicId={topic} />
    </div>
  );
}
