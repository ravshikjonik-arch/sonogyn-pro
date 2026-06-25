"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardCopy, FileText, Footprints } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyLlaConclusionTemplate,
  buildLlaConclusionDraft,
  LLA_CONCLUSION_TEMPLATES,
  LLA_PROTOCOL_TABLE_SECTIONS,
  LLA_SCANNING_ROUTE,
  type LlaConclusionTemplateId,
  type LlaSide,
  sideLabelLla,
} from "@/lib/ai/vascular-ultrasound/lower-limb-arteries-protocol";
import {
  gradeLowerLimbStenosis,
  LOWER_LIMB_ARTERIAL_NORMS,
  LOWER_LIMB_STENOSIS_DOPPLER,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

export function LowerLimbArteriesProtocolPanel() {
  const [side, setSide] = useState<LlaSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<LlaConclusionTemplateId[]>(["normal"]);
  const [percent, setPercent] = useState("");
  const [abi, setAbi] = useState("");
  const [psvStenosis, setPsvStenosis] = useState("");
  const [psvProximal, setPsvProximal] = useState("");

  const stenosisGrade = useMemo(() => {
    if (!psvStenosis && !psvProximal) return null;
    return gradeLowerLimbStenosis({
      psvStenosisCmS: psvStenosis ? Number(psvStenosis) : null,
      psvProximalCmS: psvProximal ? Number(psvProximal) : null,
    });
  }, [psvProximal, psvStenosis]);

  const conclusionDraft = useMemo(
    () =>
      buildLlaConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: {
            side: sideLabelLla(side),
            percent: percent || undefined,
            abi: abi || undefined,
          },
        })),
      ),
    [abi, percent, selectedTemplates, side],
  );

  const toggleTemplate = (id: LlaConclusionTemplateId) => {
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
            <Footprints className="h-5 w-5 text-[var(--clinical-primary)]" />
            Глава 6 · Артерии НК (Куликов)
          </CardTitle>
          <CardDescription>§6.3 маршрут · табл. 6.1 стеноз · ЛПИ/ППИ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">Маршрут сканирования</p>
          <ul className="list-disc pl-5 text-[var(--clinical-foreground-muted)]">
            {LLA_SCANNING_ROUTE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Протокол (§6.7)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {LLA_PROTOCOL_TABLE_SECTIONS.map((sec) => (
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
            <Activity className="h-5 w-5" />
            Нормы и стеноз
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <NormItem label="ЛПИ норма" value={`${LOWER_LIMB_ARTERIAL_NORMS.abiNormalMin}–${LOWER_LIMB_ARTERIAL_NORMS.abiNormalMax}`} />
            <NormItem label="ЛПИ патология" value={`<${LOWER_LIMB_ARTERIAL_NORMS.abiPathologicMax}`} />
            <NormItem label="ППИ (диабет)" value={`<${LOWER_LIMB_ARTERIAL_NORMS.toeBrachialIndexPathologicMax}`} />
            <NormItem label="ИПС стеноз" value={`≥${LOWER_LIMB_ARTERIAL_NORMS.peakVelocityRatioStenosisMin}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              PSV в стенозе (см/с)
              <Input className="mt-1" inputMode="decimal" value={psvStenosis} onChange={(e) => setPsvStenosis(e.target.value)} />
            </label>
            <label className="text-sm">
              PSV проксимально (см/с)
              <Input className="mt-1" inputMode="decimal" value={psvProximal} onChange={(e) => setPsvProximal(e.target.value)} />
            </label>
          </div>
          {stenosisGrade ? (
            <div className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3">
              <p className="font-medium">
                {stenosisGrade.label} · {stenosisGrade.percentRange}
              </p>
              <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
                {stenosisGrade.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Стеноз</th>
                  <th className="p-2">PSV</th>
                  <th className="p-2">Спектр</th>
                </tr>
              </thead>
              <tbody>
                {LOWER_LIMB_STENOSIS_DOPPLER.map((row) => (
                  <tr key={row.range} className="border-b border-[var(--clinical-border)]">
                    <td className="p-2">{row.range}</td>
                    <td className="p-2">
                      {"psvMax" in row
                        ? `<${row.psvMax} см/с`
                        : "psvMin" in row
                          ? `>${row.psvMin} см/с`
                          : "psvRange" in row
                            ? `${row.psvRange} см/с`
                            : row.psvNote}
                    </td>
                    <td className="p-2">{row.spectrum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Заключение (§6.8)
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              % стеноза
              <Input className="mt-1" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="60" />
            </label>
            <label className="text-sm">
              ЛПИ / ППИ
              <Input className="mt-1" value={abi} onChange={(e) => setAbi(e.target.value)} placeholder="0,75" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LLA_CONCLUSION_TEMPLATES.map((t) => (
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
              Превью:{" "}
              {applyLlaConclusionTemplate(selectedTemplates[0]!, {
                side: sideLabelLla(side),
                percent,
                abi,
              })}
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
