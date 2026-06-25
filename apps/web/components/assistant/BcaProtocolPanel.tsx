"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, FileText, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyBcaConclusionTemplate,
  BCA_CONCLUSION_TEMPLATES,
  BCA_FUNCTIONAL_TESTS,
  BCA_PROTOCOL_TABLE_SECTIONS,
  BCA_SCANNING_POINTS,
  buildBcaConclusionDraft,
  type BcaConclusionTemplateId,
  type BcaSide,
  sideLabel,
} from "@/lib/ai/vascular-ultrasound/extracranial-bca-protocol";
import {
  CAROTID_STENOSIS_DOPPLER_CRITERIA,
  EXTRACRANIAL_ARTERIAL_NORMS,
  EXTRACRANIAL_VENOUS_NORMS,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

export function BcaProtocolPanel() {
  const [side, setSide] = useState<BcaSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<BcaConclusionTemplateId[]>(["normal"]);
  const [percent, setPercent] = useState("");
  const [imt, setImt] = useState("");

  const conclusionDraft = useMemo(
    () =>
      buildBcaConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: {
            side: sideLabel(side),
            percent: percent || undefined,
            imtMm: imt || undefined,
          },
        })),
      ),
    [imt, percent, selectedTemplates, side],
  );

  const toggleTemplate = (id: BcaConclusionTemplateId) => {
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
            <ListChecks className="h-5 w-5 text-[var(--clinical-primary)]" />
            Глава 4 · БЦА — методика (Куликов)
          </CardTitle>
          <CardDescription>§4.3 точки сканирования · §4.3.2 пробы · обязательно АД на обеих руках</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <SectionBlock title="Стандартные точки (§4.3.1)" items={[...BCA_SCANNING_POINTS]} />
          <div>
            <p className="font-medium">Функциональные пробы (§4.3.2)</p>
            <ul className="mt-2 space-y-3">
              {BCA_FUNCTIONAL_TESTS.map((t) => (
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
          <CardTitle className="text-lg">Табличный протокол (§4.8)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {BCA_PROTOCOL_TABLE_SECTIONS.map((sec) => (
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
          <CardTitle className="text-lg">Нормы и пороги</CardTitle>
          <CardDescription>Табл. 4.1 · §4.4 · венозные критерии §4.5.3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <NormItem label="ТИМ ОСА норма" value={`≤${EXTRACRANIAL_ARTERIAL_NORMS.ccaImtNormalMaxMm} мм`} />
            <NormItem label="PSV ВСА норма" value={`≤${EXTRACRANIAL_ARTERIAL_NORMS.icaPsvNormalMaxCmS} см/с`} />
            <NormItem label="Асимметрия PSV" value={`<${EXTRACRANIAL_ARTERIAL_NORMS.psvAsymmetryMaxPercent}%`} />
            <NormItem label="ПА гипоплазия" value={`<${EXTRACRANIAL_ARTERIAL_NORMS.vaHypoplasiaMaxMm} мм`} />
            <NormItem label="Vmax ВЯВ" value={`≤${EXTRACRANIAL_VENOUS_NORMS.ijvPsvMaxCmS} см/с`} />
            <NormItem label="Vmax ПВ (лежа)" value={`≤${EXTRACRANIAL_VENOUS_NORMS.pvPsvMaxCmS} см/с`} />
          </div>
          <div>
            <p className="font-medium">Допплер-стеноз ВСА (табл. 4.1)</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Стеноз</th>
                    <th className="p-2">PSV ВСА</th>
                    <th className="p-2">ICA/CCA</th>
                    <th className="p-2">EDV ВСА</th>
                  </tr>
                </thead>
                <tbody>
                  {CAROTID_STENOSIS_DOPPLER_CRITERIA.map((row) => (
                    <tr key={row.stenosisRange} className="border-b border-[var(--clinical-border)]">
                      <td className="p-2">{row.stenosisRange}</td>
                      <td className="p-2">{formatPsvRange(row)} см/с</td>
                      <td className="p-2">{formatRatioRange(row)}</td>
                      <td className="p-2">{formatEdvRange(row)} см/с</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
              При пульсовом АД &gt;60 мм рт.ст. — коррекция PSV −20%. Метод стеноза в протоколе обязателен (ECST/NASCET).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Генератор заключения (§4.9)
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
              % стеноза (если применимо)
              <Input className="mt-1" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="55" />
            </label>
            <label className="text-sm">
              ТИМ, мм
              <Input className="mt-1" value={imt} onChange={(e) => setImt(e.target.value)} placeholder="1,2" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BCA_CONCLUSION_TEMPLATES.map((t) => (
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
              Превью: {applyBcaConclusionTemplate(selectedTemplates[0]!, { side: sideLabel(side), percent, imtMm: imt })}
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

function SectionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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

function formatPsvRange(row: (typeof CAROTID_STENOSIS_DOPPLER_CRITERIA)[number]): string {
  if ("psvIcaMin" in row && "psvIcaMax" in row) return `${row.psvIcaMin}–${row.psvIcaMax}`;
  if ("psvIcaMin" in row) return `≥${row.psvIcaMin}`;
  return `<${row.psvIcaMax}`;
}

function formatRatioRange(row: (typeof CAROTID_STENOSIS_DOPPLER_CRITERIA)[number]): string {
  if ("icaCcaRatioMin" in row && "icaCcaRatioMax" in row) return `${row.icaCcaRatioMin}–${row.icaCcaRatioMax}`;
  if ("icaCcaRatioMin" in row) return `≥${row.icaCcaRatioMin}`;
  return `<${row.icaCcaRatioMax}`;
}

function formatEdvRange(row: (typeof CAROTID_STENOSIS_DOPPLER_CRITERIA)[number]): string {
  if ("edvIcaMin" in row && !("edvIcaMax" in row)) return `≥${row.edvIcaMin}`;
  if ("edvIcaMin" in row && "edvIcaMax" in row) return `${row.edvIcaMin}–${row.edvIcaMax}`;
  return `<${row.edvIcaMax}`;
}
