"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Brain, FileText } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyTcdConclusionTemplate,
  buildTcdConclusionDraft,
  TCD_CONCLUSION_TEMPLATES,
  TCD_FUNCTIONAL_TESTS,
  TCD_PROTOCOL_TABLE_SECTIONS,
  TCD_SCANNING_WINDOWS,
  type TcdConclusionTemplateId,
  type TcdSide,
  sideLabelTcd,
} from "@/lib/ai/vascular-ultrasound/tcd-protocol";
import { gradeLindegaardRatio, TCD_ARTERIAL_NORMS } from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

export function TcdProtocolPanel() {
  const [side, setSide] = useState<TcdSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<TcdConclusionTemplateId[]>(["normal"]);
  const [mcaPsv, setMcaPsv] = useState("");
  const [icaPsv, setIcaPsv] = useState("");

  const lindegaard = useMemo(() => {
    const mca = Number(mcaPsv);
    const ica = Number(icaPsv);
    if (!mcaPsv || !icaPsv || Number.isNaN(mca) || Number.isNaN(ica)) return null;
    return gradeLindegaardRatio(mca, ica);
  }, [icaPsv, mcaPsv]);

  const conclusionDraft = useMemo(
    () =>
      buildTcdConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: { side: sideLabelTcd(side) },
        })),
      ),
    [selectedTemplates, side],
  );

  const toggleTemplate = (id: TcdConclusionTemplateId) => {
    setSelectedTemplates((prev) => {
      if (id === "normal") return ["normal"];
      const withoutNormal = prev.filter((x) => x !== "normal");
      if (withoutNormal.includes(id)) {
        const next = withoutNormal.filter((x) => x !== id);
        return next.length ? next : ["normal"];
      }
      return [...withoutNormal, id];
    });
  };

  const copyDraft = async () => {
    if (!conclusionDraft) return;
    await navigator.clipboard.writeText(conclusionDraft);
    toast.success("Заключение скопировано");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-[var(--clinical-primary)]" />
            Глава 5 · TCD — методика (Куликов)
          </CardTitle>
          <CardDescription>Окна доступа · пробы · TIBI при инсульте · мониторинг SAH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {TCD_SCANNING_WINDOWS.map((w) => (
            <div key={w.window}>
              <p className="font-medium">{w.window}</p>
              <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
                {w.arteries.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-medium">Функциональные пробы (§5.3.2)</p>
            <ul className="mt-2 space-y-3">
              {TCD_FUNCTIONAL_TESTS.map((t) => (
                <li key={t.name} className="rounded-xl border border-[var(--clinical-border)] p-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-[var(--clinical-foreground-muted)]">{t.indication}</p>
                  <p className="mt-1 text-xs">{t.technique}</p>
                  <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{t.interpretation}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Нормы и стеноз (§5.4–5.5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <NormItem label="PSV СМА норма" value={`≤${TCD_ARTERIAL_NORMS.mcaPsvNormalMaxCmS} см/с`} />
            <NormItem label="Асимметрия" value={`<${TCD_ARTERIAL_NORMS.interhemisphericAsymmetryMaxPercent}%`} />
            <NormItem label="RI" value={`${TCD_ARTERIAL_NORMS.riNormalMin}–${TCD_ARTERIAL_NORMS.riNormalMax}`} />
            <NormItem label="Vmax вен" value={`≤${TCD_ARTERIAL_NORMS.intracranialVenousVmaxMaxCmS} см/с`} />
          </div>
          <div>
            <p className="font-medium">Стеноз &gt;50% — критические PSV</p>
            <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
              <li>СМА &gt;{TCD_ARTERIAL_NORMS.stenosisMcaPsvCmS} см/с</li>
              <li>ПМА &gt;{TCD_ARTERIAL_NORMS.stenosisAcaPsvCmS} см/с</li>
              <li>ЗМА &gt;{TCD_ARTERIAL_NORMS.stenosisPcaPsvCmS} см/с</li>
              <li>ПА &gt;{TCD_ARTERIAL_NORMS.stenosisVaPsvCmS} см/с</li>
              <li>ОА &gt;{TCD_ARTERIAL_NORMS.stenosisBaPsvCmS} см/с</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--clinical-border)] p-3">
            <p className="font-medium">Индекс Линдегарда (SAH)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                PSV СМА (см/с)
                <Input className="mt-1" inputMode="decimal" value={mcaPsv} onChange={(e) => setMcaPsv(e.target.value)} />
              </label>
              <label className="text-sm">
                PSV ВСА экстракран. (см/с)
                <Input className="mt-1" inputMode="decimal" value={icaPsv} onChange={(e) => setIcaPsv(e.target.value)} />
              </label>
            </div>
            {lindegaard ? (
              <p className="mt-2 text-[var(--clinical-foreground-muted)]">
                Ratio {lindegaard.ratio.toFixed(1)} — {lindegaard.label}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
              2,2–3 — гиперперфузия; &gt;3 — умеренный спазм; &gt;6 — выраженный (Lindegaard K.F. et al., 1988).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Табличный протокол (§5.8)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {TCD_PROTOCOL_TABLE_SECTIONS.map((sec) => (
            <div key={sec.title} className="rounded-xl border border-[var(--clinical-border)] p-3 text-sm">
              <p className="font-medium">{sec.title}</p>
              <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
                {sec.fields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Генератор заключения (§5.9)
          </CardTitle>
          <CardDescription>{VASCULAR_US_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["right", "Справа"],
                ["left", "Слева"],
                ["bilateral", "С обеих сторон"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSide(id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  side === id ? "bg-[var(--clinical-primary)] text-white" : "bg-[var(--clinical-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TCD_CONCLUSION_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTemplate(t.id)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                  selectedTemplates.includes(t.id)
                    ? "bg-[var(--clinical-primary)] text-white"
                    : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]"
                }`}
              >
                {t.number}. {t.label}
              </button>
            ))}
          </div>
          {selectedTemplates.length === 1 && selectedTemplates[0] !== "normal" ? (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Превью: {applyTcdConclusionTemplate(selectedTemplates[0]!, { side: sideLabelTcd(side) })}
            </p>
          ) : null}
          {conclusionDraft ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Черновик</Badge>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyDraft()}>
                  <ClipboardCopy className="mr-1 h-4 w-4" />
                  Копировать
                </Button>
              </div>
              <pre className="whitespace-pre-wrap rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-4 text-sm leading-relaxed">
                {conclusionDraft}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function NormItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--clinical-muted)]/40 px-3 py-2">
      <p className="text-xs text-[var(--clinical-foreground-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
