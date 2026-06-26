"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  CpiDisclaimer,
  evaluateCpiCase,
  generateCpiHtmlReport,
  type CpiCaseInput,
  type CpiEvaluationResult,
} from "@repo/cervical-pathology";
import { IFCPC_SIGNS } from "@repo/ifcpc-expert";

type PatientRow = { id: string; display_label: string };
type StudyRow = { id: string; title?: string | null; study_type?: string; created_at: string };

export type CpiDashboardProps = {
  initialPatientId?: string;
  initialStudyId?: string;
};

const RISK_COLORS = {
  cin1: "#14b8a6",
  cin2: "#f59e0b",
  cin3: "#f97316",
  ais: "#ef4444",
  invasion: "#991b1b",
};

const HPV_GENOTYPES = [
  "hpv16",
  "hpv18",
  "hpv31",
  "hpv33",
  "hpv45",
  "hpv52",
  "hpv58",
  "other_hr",
] as const;

const CYTOLOGY = ["nilm", "ascus", "asc_h", "lsil", "hsil", "agc", "ais", "scc", "unsatisfactory"] as const;
const HISTOLOGY = ["none", "negative", "cin1", "cin2", "cin3", "ais", "microinvasive", "invasive", "pending"] as const;

function defaultInput(patientId?: string): CpiCaseInput {
  return {
    patientId,
    colposcopy: {
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz2",
      findingSignIds: [],
    },
    hpv: { status: "positive", genotypes: ["other_hr"], viralLoad: "not_available", persistent: false },
    cytology: { result: "lsil" },
    histology: { result: "none" },
    swede: { acetowhite: 0, margins: 0, vessels: 0, lesionSize: 0, iodine: 0 },
    clinical: {
      age: 35,
      pregnancy: false,
      immunosuppression: false,
      smoking: false,
      priorCinTreatment: "none",
      glandularSuspicion: "none",
      suspectedGlandularLesion: false,
    },
    quality: {
      scjDocumented: true,
      tzDocumented: true,
      aceticAcidAssessment: true,
      iodineTestPerformed: false,
      lesionDocumented: false,
      photoPreAcetic: true,
      photoPostAcetic: true,
      photoPostSchiller: false,
      adequacyDocumented: true,
    },
  };
}

function BoolChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <CalcChip label={value ? `✓ ${label}` : label} selected={value} onClick={() => onChange(!value)} />;
}

function toggle<T extends string>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function RiskCard({ evaluation }: { evaluation: CpiEvaluationResult }) {
  const r = evaluation.risk;
  const rows = [
    { key: "cin1", label: "CIN1", pct: r.cin1Risk * 100, color: RISK_COLORS.cin1 },
    { key: "cin2", label: "CIN2+", pct: r.cin2PlusRisk * 100, color: RISK_COLORS.cin2, highlight: true },
    { key: "cin3", label: "CIN3+", pct: r.cin3PlusRisk * 100, color: RISK_COLORS.cin3 },
    { key: "ais", label: "AIS", pct: r.aisRisk * 100, color: RISK_COLORS.ais },
    { key: "inv", label: "Invasion", pct: r.invasionRisk * 100, color: RISK_COLORS.invasion },
  ];
  return (
    <CalcStepCard title="Risk Assessment">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className={cn(row.highlight && "rounded-xl border p-2")}>
            <div className="flex justify-between text-xs font-bold">
              <span>{row.label}</span>
              <span style={{ color: row.color }}>{row.pct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full" style={{ width: `${Math.min(row.pct, 100)}%`, backgroundColor: row.color }} />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Confidence: {(r.confidenceScore * 100).toFixed(0)}%
          {evaluation.swedeTotal !== null && ` · Swede ${evaluation.swedeTotal}/10`}
        </p>
      </div>
    </CalcStepCard>
  );
}

function QualityWidget({ evaluation }: { evaluation: CpiEvaluationResult }) {
  if (evaluation.qualityScore === null) return null;
  const score = evaluation.qualityScore;
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#14b8a6" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="rounded-xl border p-4">
      <CalcSubLabel>Colposcopy Quality</CalcSubLabel>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">{evaluation.qualityInterpretation}</span>
      </div>
    </div>
  );
}

export function CpiDashboard({ initialPatientId, initialStudyId }: CpiDashboardProps) {
  const [input, setInput] = useState<CpiCaseInput>(() => defaultInput(initialPatientId));
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? "");
  const [selectedStudyId, setSelectedStudyId] = useState(initialStudyId ?? "");
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const evaluation = useMemo(() => evaluateCpiCase(input), [input]);

  const colposcopySigns = useMemo(
    () => IFCPC_SIGNS.filter((s) => !["adequacy", "scj_visibility", "transformation_zone_type"].includes(s.sectionId)),
    [],
  );

  const loadPatients = useCallback(async (q: string) => {
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const json = (await res.json()) as { patients: PatientRow[] };
    setPatients(json.patients ?? []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadPatients(patientQuery), 250);
    return () => clearTimeout(t);
  }, [patientQuery, loadPatients]);

  useEffect(() => {
    if (!initialPatientId) return;
    void (async () => {
      const res = await fetch(`/api/patients/${initialPatientId}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        patient: { id: string; display_label: string; meta?: { date_of_birth?: string | null } };
        studies: StudyRow[];
      };
      setPatients((prev) => {
        const exists = prev.some((p) => p.id === json.patient.id);
        if (exists) return prev;
        return [{ id: json.patient.id, display_label: json.patient.display_label }, ...prev];
      });
      setStudies(json.studies ?? []);
      if (!initialStudyId && json.studies?.[0]) {
        setSelectedStudyId(json.studies[0].id);
      }
      const dob = json.patient.meta?.date_of_birth;
      if (dob) {
        const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
        if (age >= 15 && age <= 90) {
          setInput((p) => ({ ...p, clinical: { ...p.clinical, age } }));
        }
      }
    })();
  }, [initialPatientId, initialStudyId]);

  useEffect(() => {
    if (!selectedPatientId) {
      setStudies([]);
      return;
    }
    setInput((p) => ({ ...p, patientId: selectedPatientId }));
    if (selectedPatientId === initialPatientId) return;
    void (async () => {
      const res = await fetch(`/api/patients/${selectedPatientId}`);
      if (!res.ok) return;
      const json = (await res.json()) as { studies: StudyRow[] };
      setStudies(json.studies ?? []);
    })();
  }, [selectedPatientId, initialPatientId]);

  const patchClinical = useCallback(
    <K extends keyof CpiCaseInput["clinical"]>(key: K, value: CpiCaseInput["clinical"][K]) => {
      setInput((prev) => ({ ...prev, clinical: { ...prev.clinical, [key]: value } }));
    },
    [],
  );

  const downloadReport = async (format: "html" | "pdf" | "docx") => {
    setBusy(true);
    try {
      const res = await fetch("/api/cpi/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, input, caseId: savedCaseId ?? undefined, persist: Boolean(savedCaseId) }),
      });
      if (!res.ok) throw new Error("Report failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cpi-report.${format === "html" ? "html" : format}`;
      a.click();
      URL.revokeObjectURL(url);
      if (format === "html") setReportHtml(await blob.text());
    } finally {
      setBusy(false);
    }
  };

  const saveCase = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/cpi/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, patientId: selectedPatientId || input.patientId }),
      });
      const data = (await res.json()) as { caseId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedCaseId(data.caseId ?? null);
    } catch {
      setSavedCaseId(null);
    } finally {
      setBusy(false);
    }
  };

  const runAiAnalyze = async () => {
    if (!aiImageUrl.trim()) {
      setAiStatus("Укажите URL изображения post-acetic.");
      return;
    }
    const caseId = savedCaseId ?? crypto.randomUUID();
    setBusy(true);
    setAiStatus(null);
    try {
      const res = await fetch("/api/cpi/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: aiImageUrl.trim(), caseId, input }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        message?: string;
        mergedFindingIds?: string[];
        analysis?: { cin2PlusProbability?: number | null; cin3PlusProbability?: number | null };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "AI failed");

      if (!data.configured) {
        setAiStatus(data.message ?? "AI pipeline не настроен (CPI_AI_COLPOSCOPY_URL).");
        return;
      }

      if (data.mergedFindingIds?.length) {
        setInput((p) => ({
          ...p,
          colposcopy: { ...p.colposcopy, findingSignIds: data.mergedFindingIds! },
        }));
      }
      const c2 = data.analysis?.cin2PlusProbability;
      const c3 = data.analysis?.cin3PlusProbability;
      setAiStatus(
        `AI: IFCPC ${data.mergedFindingIds?.length ?? 0} signs` +
          (c2 != null ? ` · CIN2+ ${(c2 * 100).toFixed(0)}%` : "") +
          (c3 != null ? ` · CIN3+ ${(c3 * 100).toFixed(0)}%` : ""),
      );
      if (!savedCaseId) setSavedCaseId(caseId);
    } catch (e) {
      setAiStatus(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-16">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Cervical Pathology Intelligence</h1>
          <Badge variant="secondary">IFCPC · HPV · Bethesda · Swede · CDS</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Экспертная система для кольпоскопии и патологии шейки матки.{" "}
          <Link href="/tools/calc/gyn/cin-risk" className="underline">
            CIN Risk
          </Link>
          {" · "}
          <Link href="/tools/calc/gyn/colposcopy" className="underline">
            Colposcopy Flow
          </Link>
        </p>
      </header>

      <CalcStepCard title="Patient / Study">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <CalcSubLabel>Поиск пациентки</CalcSubLabel>
            <Input
              className="mt-1"
              placeholder="ФИО / метка"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
          </div>
          <div>
            <CalcSubLabel>Пациентка</CalcSubLabel>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm dark:bg-slate-900"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">— без привязки —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <CalcSubLabel>Исследование (контекст)</CalcSubLabel>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm dark:bg-slate-900"
              value={selectedStudyId}
              onChange={(e) => setSelectedStudyId(e.target.value)}
              disabled={!selectedPatientId || studies.length === 0}
            >
              <option value="">— не выбрано —</option>
              {studies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title ?? s.study_type} · {new Date(s.created_at).toLocaleDateString("ru-RU")}
                </option>
              ))}
            </select>
            {selectedPatientId && (
              <Link href={`/patients/${selectedPatientId}`} className="mt-1 block text-xs underline">
                Карточка пациентки →
              </Link>
            )}
          </div>
        </div>
      </CalcStepCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <CalcStepCard title="Clinical context">
            <div className="flex flex-wrap gap-2">
              <div className="w-24">
                <CalcSubLabel>Возраст</CalcSubLabel>
                <Input
                  type="number"
                  value={input.clinical.age}
                  onChange={(e) => patchClinical("age", Number(e.target.value))}
                />
              </div>
              <BoolChip label="Беременность" value={input.clinical.pregnancy} onChange={(v) => patchClinical("pregnancy", v)} />
              <BoolChip label="Иммунодеф." value={input.clinical.immunosuppression} onChange={(v) => patchClinical("immunosuppression", v)} />
              <BoolChip label="Курение" value={input.clinical.smoking} onChange={(v) => patchClinical("smoking", v)} />
            </div>
          </CalcStepCard>

          <CalcStepCard title="HPV">
            <div className="flex flex-wrap gap-2">
              {(["negative", "positive", "not_tested"] as const).map((s) => (
                <CalcChip
                  key={s}
                  label={s}
                  selected={input.hpv.status === s}
                  onClick={() => setInput((p) => ({ ...p, hpv: { ...p.hpv, status: s, genotypes: s === "negative" ? ["negative"] : p.hpv.genotypes.filter((g) => g !== "negative") } }))}
                />
              ))}
            </div>
            {input.hpv.status === "positive" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {HPV_GENOTYPES.map((g) => (
                  <CalcChip
                    key={g}
                    label={g.replace("hpv", "HPV ").replace("_", " ")}
                    selected={input.hpv.genotypes.includes(g)}
                    onClick={() =>
                      setInput((p) => ({
                        ...p,
                        hpv: { ...p.hpv, genotypes: toggle(p.hpv.genotypes, g) },
                      }))
                    }
                  />
                ))}
                <BoolChip
                  label="Persistent"
                  value={input.hpv.persistent}
                  onChange={(v) => setInput((p) => ({ ...p, hpv: { ...p.hpv, persistent: v } }))}
                />
              </div>
            )}
          </CalcStepCard>

          <CalcStepCard title="Bethesda (cytology)">
            <div className="flex flex-wrap gap-2">
              {CYTOLOGY.map((c) => (
                <CalcChip
                  key={c}
                  label={c.toUpperCase()}
                  selected={input.cytology.result === c}
                  onClick={() => setInput((p) => ({ ...p, cytology: { ...p.cytology, result: c } }))}
                />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="Colposcopy / IFCPC">
            <div className="mb-3 flex flex-wrap gap-2">
              {(["tz1", "tz2", "tz3"] as const).map((tz) => (
                <CalcChip
                  key={tz}
                  label={tz.toUpperCase()}
                  selected={input.colposcopy.transformationZoneTypeId === tz}
                  onClick={() =>
                    setInput((p) => ({
                      ...p,
                      colposcopy: { ...p.colposcopy, transformationZoneTypeId: tz },
                    }))
                  }
                />
              ))}
              {(
                [
                  ["scj_completely_visible", "SCJ visible"],
                  ["scj_partially_visible", "SCJ partial"],
                  ["scj_not_visible", "SCJ hidden"],
                ] as const
              ).map(([id, label]) => (
                <CalcChip
                  key={id}
                  label={label}
                  selected={input.colposcopy.scjVisibilityId === id}
                  onClick={() =>
                    setInput((p) => ({
                      ...p,
                      colposcopy: { ...p.colposcopy, scjVisibilityId: id },
                    }))
                  }
                />
              ))}
            </div>
            <CalcSubLabel>IFCPC findings</CalcSubLabel>
            <div className="mt-2 flex max-h-48 flex-wrap gap-1 overflow-y-auto">
              {colposcopySigns.map((sign) => (
                <CalcChip
                  key={sign.id}
                  label={sign.titleRu}
                  selected={input.colposcopy.findingSignIds.includes(sign.id)}
                  onClick={() =>
                    setInput((p) => ({
                      ...p,
                      colposcopy: {
                        ...p.colposcopy,
                        findingSignIds: toggle(p.colposcopy.findingSignIds, sign.id),
                      },
                    }))
                  }
                />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="Swede Score (0–2 per domain)">
            {(["acetowhite", "margins", "vessels", "lesionSize", "iodine"] as const).map((field) => (
              <div key={field} className="mb-2">
                <CalcSubLabel>{field}</CalcSubLabel>
                <div className="flex gap-2">
                  {([0, 1, 2] as const).map((v) => (
                    <CalcChip
                      key={v}
                      label={String(v)}
                      selected={(input.swede?.[field] ?? 0) === v}
                      onClick={() =>
                        setInput((p) => ({
                          ...p,
                          swede: { ...(p.swede ?? defaultInput().swede!), [field]: v },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </CalcStepCard>

          <CalcStepCard title="Histology">
            <div className="flex flex-wrap gap-2">
              {HISTOLOGY.map((h) => (
                <CalcChip
                  key={h}
                  label={h}
                  selected={input.histology.result === h}
                  onClick={() => setInput((p) => ({ ...p, histology: { ...p.histology, result: h } }))}
                />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="Quality checklist">
            {input.quality && (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(input.quality) as (keyof NonNullable<CpiCaseInput["quality"]>)[]).map((k) => (
                  <BoolChip
                    key={k}
                    label={k}
                    value={input.quality![k]}
                    onChange={(v) =>
                      setInput((p) => ({
                        ...p,
                        quality: { ...p.quality!, [k]: v },
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </CalcStepCard>

          <CalcStepCard title="AI Colposcopy (optional)">
            <CalcSubLabel>URL изображения post-acetic</CalcSubLabel>
            <Input
              className="mt-1"
              placeholder="https://storage…/colposcopy.jpg"
              value={aiImageUrl}
              onChange={(e) => setAiImageUrl(e.target.value)}
            />
            <Button className="mt-2" variant="outline" disabled={busy} onClick={() => void runAiAnalyze()}>
              AI analyze → merge IFCPC
            </Button>
            {aiStatus && <p className="mt-2 text-xs text-muted-foreground">{aiStatus}</p>}
          </CalcStepCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <RiskCard evaluation={evaluation} />
          <QualityWidget evaluation={evaluation} />

          <CalcStepCard title="Clinical Decision">
            <div className="space-y-3">
              {evaluation.actions.map((a) => (
                <div key={a.action} className="rounded-lg border p-3 text-sm">
                  <div className="font-semibold">{a.labelRu}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.rationale}</p>
                  {a.references.length > 0 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {a.references.map((r) => `${r.organization} ${r.year}`).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xs">{evaluation.explanation}</p>
            </div>
          </CalcStepCard>

          <CalcStepCard title="Protocol preview">
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-[11px]">{evaluation.ifcpcProtocolText}</pre>
            <p className="mt-2 text-xs font-medium">{evaluation.ifcpcConclusion}</p>
          </CalcStepCard>

          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void saveCase()}>
              Save case
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void downloadReport("html")}>
              HTML
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void downloadReport("pdf")}>
              PDF
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void downloadReport("docx")}>
              DOCX
            </Button>
            <Button
              variant="ghost"
              onClick={() => setReportHtml(generateCpiHtmlReport(input, evaluation))}
            >
              Preview
            </Button>
          </div>

          {savedCaseId && (
            <p className="text-xs text-muted-foreground">Case ID: {savedCaseId}</p>
          )}

          <p className="text-[10px] text-muted-foreground">{CpiDisclaimer}</p>
        </aside>
      </div>

      {reportHtml && (
        <CalcStepCard title="Report viewer">
          <iframe title="CPI Report" className="h-[480px] w-full rounded border bg-white" srcDoc={reportHtml} />
        </CalcStepCard>
      )}
    </div>
  );
}
