"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, FileText, HeartPulse } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AAA_AORTA_PROTOCOL_SECTIONS,
  AAA_FUNCTIONAL_TESTS,
  AAA_RENAL_PROTOCOL_SECTIONS,
  AAA_SCANNING_ROUTE,
  AAA_ALL_CONCLUSION_TEMPLATES,
  buildAaaConclusionDraft,
  type AaaConclusionTemplateId,
  type AaaSide,
  sideLabelAaa,
} from "@/lib/ai/vascular-ultrasound/abdominal-aorta-protocol";
import {
  ABDOMINAL_AORTA_NORMS,
  gradeAaaDiameter,
  gradeCeliacCompression,
  gradeRenalAorticRatio,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

export function AbdominalAortaProtocolPanel() {
  const [side, setSide] = useState<AaaSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<AaaConclusionTemplateId[]>(["normal-aorta"]);
  const [aortaDiameter, setAortaDiameter] = useState("");
  const [psvRenal, setPsvRenal] = useState("");
  const [psvAorta, setPsvAorta] = useState("");
  const [psvCeliacInsp, setPsvCeliacInsp] = useState("");
  const [psvCeliacExp, setPsvCeliacExp] = useState("");

  const diameterGrade = useMemo(() => {
    const d = Number(aortaDiameter);
    if (!aortaDiameter || Number.isNaN(d)) return null;
    return gradeAaaDiameter(d);
  }, [aortaDiameter]);

  const rar = useMemo(() => {
    const renal = Number(psvRenal);
    const aorta = Number(psvAorta);
    if (!psvRenal || !psvAorta || Number.isNaN(renal) || Number.isNaN(aorta)) return null;
    return gradeRenalAorticRatio(renal, aorta);
  }, [psvAorta, psvRenal]);

  const celiacCompression = useMemo(() => {
    const insp = Number(psvCeliacInsp);
    const exp = Number(psvCeliacExp);
    if (!psvCeliacInsp || !psvCeliacExp || Number.isNaN(insp) || Number.isNaN(exp)) return null;
    return gradeCeliacCompression({ psvInspirationCmS: insp, psvExpirationCmS: exp });
  }, [psvCeliacExp, psvCeliacInsp]);

  const conclusionDraft = useMemo(
    () =>
      buildAaaConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: {
            side: sideLabelAaa(side),
            diameterMm: aortaDiameter || undefined,
          },
        })),
      ),
    [aortaDiameter, selectedTemplates, side],
  );

  const toggleTemplate = (id: AaaConclusionTemplateId) => {
    setSelectedTemplates((prev) => {
      if (id.startsWith("normal-")) return [id];
      const withoutNormal = prev.filter((x) => !x.startsWith("normal-"));
      if (withoutNormal.includes(id)) {
        const next = withoutNormal.filter((x) => x !== id);
        return next.length ? next : ["normal-aorta"];
      }
      return [...withoutNormal, id];
    });
  };

  const copyDraft = async () => {
    if (!conclusionDraft) return;
    await navigator.clipboard.writeText(conclusionDraft);
    toast.success("Заключение скопировано");
  };

  const n = ABDOMINAL_AORTA_NORMS;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5 text-[var(--clinical-primary)]" />
            Аорта и висцеральные ветви · гл. 9
          </CardTitle>
          <CardDescription>AAA · RAR · ЭКЧС · ЧС/ВБА — по Куликову (2015)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {(["right", "left", "bilateral"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  side === s
                    ? "bg-[var(--clinical-primary)] text-white"
                    : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]"
                }`}
              >
                {sideLabelAaa(s)}
              </button>
            ))}
          </div>

          <Section title="Маршрут §9.3.1" items={[...AAA_SCANNING_ROUTE]} />
          <Section title="Пробы §9.3.2" items={[...AAA_FUNCTIONAL_TESTS]} />

          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-4">
            <p className="font-medium">Пороги §9.4–9.5</p>
            <ul className="mt-2 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
              <li>Диаметр аорты &lt;{n.aortaDiameterNormalMaxMm} мм; аневризма ≥{n.aneurysmThresholdMm} мм</li>
              <li>Операция — ≥{n.aneurysmSurgicalIndicationMm} мм; рост &gt;{n.aneurysmGrowthSignificantMmPerYear} мм/год</li>
              <li>RAR &lt;{n.renalAorticRatioNormalMax}; PSV ПчА &gt;{n.renalArteryStenosisPsvCmS} см/с при стенозе</li>
              <li>ЭКЧС: +PSV ЧС на выдохе ≥{n.celiacCompressionPsvIncreaseMinPercent}%</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Калькуляторы</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Наружный диаметр аорты, мм (поперечно)
            <Input
              className="mt-1"
              inputMode="decimal"
              placeholder="42"
              value={aortaDiameter}
              onChange={(e) => setAortaDiameter(e.target.value)}
            />
          </label>
          {diameterGrade ? (
            <div className="sm:col-span-2">
              <Badge variant={diameterGrade.grade === "normal" ? "outline" : "destructive"}>
                {diameterGrade.label}
              </Badge>
              {diameterGrade.criteria.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-[var(--clinical-foreground-muted)]">
                  {diameterGrade.criteria.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <label className="text-sm">
            PSV почечной артерии, см/с
            <Input className="mt-1" inputMode="decimal" value={psvRenal} onChange={(e) => setPsvRenal(e.target.value)} />
          </label>
          <label className="text-sm">
            PSV аорты (ниже ВБА), см/с
            <Input className="mt-1" inputMode="decimal" value={psvAorta} onChange={(e) => setPsvAorta(e.target.value)} />
          </label>
          {rar ? (
            <div className="sm:col-span-2">
              <Badge variant={rar.significant ? "destructive" : "outline"}>{rar.label}</Badge>
              <ul className="mt-1 list-disc pl-5 text-xs text-[var(--clinical-foreground-muted)]">
                {rar.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="text-sm">
            PSV ЧС на вдохе, см/с
            <Input className="mt-1" inputMode="decimal" value={psvCeliacInsp} onChange={(e) => setPsvCeliacInsp(e.target.value)} />
          </label>
          <label className="text-sm">
            PSV ЧС на выдохе, см/с
            <Input className="mt-1" inputMode="decimal" value={psvCeliacExp} onChange={(e) => setPsvCeliacExp(e.target.value)} />
          </label>
          {celiacCompression ? (
            <div className="sm:col-span-2">
              <Badge variant={celiacCompression.significant ? "destructive" : "outline"}>
                {celiacCompression.label}
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Протокол §9.8
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {AAA_AORTA_PROTOCOL_SECTIONS.map((sec) => (
            <ProtocolBlock key={sec.title} title={sec.title} fields={sec.fields} />
          ))}
          {AAA_RENAL_PROTOCOL_SECTIONS.map((sec) => (
            <ProtocolBlock key={sec.title} title={sec.title} fields={sec.fields} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заключение §9.9</CardTitle>
          <CardDescription>{VASCULAR_US_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {AAA_ALL_CONCLUSION_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTemplate(t.id)}
                className={`rounded-full px-3 py-1 text-xs ${
                  selectedTemplates.includes(t.id)
                    ? "bg-[var(--clinical-primary)] text-white"
                    : "bg-[var(--clinical-muted)]"
                }`}
              >
                {t.number}. {t.label}
              </button>
            ))}
          </div>
          {conclusionDraft ? (
            <div className="space-y-2">
              <pre className="whitespace-pre-wrap rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-sm">
                {conclusionDraft}
              </pre>
              <Button variant="outline" size="sm" onClick={() => void copyDraft()}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Копировать
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
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

function ProtocolBlock({ title, fields }: { title: string; fields: readonly string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
        {fields.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
