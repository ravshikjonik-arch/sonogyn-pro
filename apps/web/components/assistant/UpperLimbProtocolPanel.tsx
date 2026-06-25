"use client";

import { useMemo, useState } from "react";
import { Armchair, ClipboardCopy, FileText, Hand } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildUlConclusionDraft,
  UL_ALL_CONCLUSION_TEMPLATES,
  UL_ARTERIAL_PROTOCOL_SECTIONS,
  UL_FUNCTIONAL_TESTS,
  UL_SCANNING_ROUTE,
  UL_VENOUS_PROTOCOL_SECTIONS,
  type UlConclusionTemplateId,
  type UlSide,
  sideLabelUl,
} from "@/lib/ai/vascular-ultrasound/upper-limb-protocol";
import {
  gradeAvAccess,
  gradeUpperLimbDynamicLoad,
  UPPER_LIMB_ARTERIAL_NORMS,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

export function UpperLimbProtocolPanel() {
  const [side, setSide] = useState<UlSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<UlConclusionTemplateId[]>(["normal-arterial"]);
  const [psvBefore, setPsvBefore] = useState("");
  const [psvAfter, setPsvAfter] = useState("");
  const [shuntPsv, setShuntPsv] = useState("");
  const [anastPsv, setAnastPsv] = useState("");
  const [volumeFlow, setVolumeFlow] = useState("");
  const [accessType, setAccessType] = useState<"fistula" | "graft">("fistula");

  const dynamicLoad = useMemo(() => {
    const before = Number(psvBefore);
    const after = Number(psvAfter);
    if (!psvBefore || !psvAfter || Number.isNaN(before) || Number.isNaN(after)) return null;
    return gradeUpperLimbDynamicLoad({ psvBeforeCmS: before, psvAfterCmS: after });
  }, [psvAfter, psvBefore]);

  const avAccess = useMemo(() => {
    if (!shuntPsv && !anastPsv && !volumeFlow) return null;
    return gradeAvAccess({
      shuntPsvCmS: shuntPsv ? Number(shuntPsv) : null,
      anastomosisPsvCmS: anastPsv ? Number(anastPsv) : null,
      volumeFlowMlMin: volumeFlow ? Number(volumeFlow) : null,
      accessType,
    });
  }, [accessType, anastPsv, shuntPsv, volumeFlow]);

  const conclusionDraft = useMemo(
    () =>
      buildUlConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: { side: sideLabelUl(side) },
        })),
      ),
    [selectedTemplates, side],
  );

  const toggleTemplate = (id: UlConclusionTemplateId) => {
    setSelectedTemplates((prev) => {
      if (id === "normal-arterial" || id === "normal-venous") return [id];
      const withoutNormal = prev.filter((x) => x !== "normal-arterial" && x !== "normal-venous");
      if (withoutNormal.includes(id)) {
        const next = withoutNormal.filter((x) => x !== id);
        return next.length ? next : ["normal-arterial"];
      }
      return [...withoutNormal, id];
    });
  };

  const copyDraft = async () => {
    if (!conclusionDraft) return;
    await navigator.clipboard.writeText(conclusionDraft);
    toast.success("Заключение скопировано");
  };

  const n = UPPER_LIMB_ARTERIAL_NORMS;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hand className="h-5 w-5 text-[var(--clinical-primary)]" />
            Верхние конечности · гл. 8
          </CardTitle>
          <CardDescription>
            ПКА · TOS · AV-фистула · тромбоз ПКВ — по Куликову (2015)
          </CardDescription>
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
                {sideLabelUl(s)}
              </button>
            ))}
          </div>

          <Section title="Маршрут §8.3.1" items={[...UL_SCANNING_ROUTE]} />
          <Section title="Пробы §8.3.2" items={[...UL_FUNCTIONAL_TESTS]} />

          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-4">
            <p className="font-medium">Нормы PSV §8.4</p>
            <ul className="mt-2 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
              <li>
                ПКА/подмышечная: {n.psvNormalCmS.subclavianAxillary.min}–
                {n.psvNormalCmS.subclavianAxillary.max} см/с
              </li>
              <li>
                Плечевая: {n.psvNormalCmS.brachial.min}–{n.psvNormalCmS.brachial.max} см/с
              </li>
              <li>
                Лучевая/локтевая: {n.psvNormalCmS.radialUlnar.min}–{n.psvNormalCmS.radialUlnar.max} см/с
              </li>
              <li>Асимметрия PSV &lt;{n.psvAsymmetryMaxPercent}%; САД на плечах &lt;{n.bpAsymmetryMaxMmHg} мм рт.ст.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Armchair className="h-5 w-5" />
            Калькуляторы
          </CardTitle>
          <CardDescription>Динамическая нагрузка · AV-фистула/шунт (табл. 8.1)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            PSV до нагрузки, см/с
            <Input className="mt-1" inputMode="decimal" value={psvBefore} onChange={(e) => setPsvBefore(e.target.value)} />
          </label>
          <label className="text-sm">
            PSV после нагрузки, см/с
            <Input className="mt-1" inputMode="decimal" value={psvAfter} onChange={(e) => setPsvAfter(e.target.value)} />
          </label>
          {dynamicLoad ? (
            <div className="sm:col-span-2 rounded-2xl border border-[var(--clinical-border)] p-3">
              <Badge variant={dynamicLoad.adequate ? "outline" : "destructive"}>{dynamicLoad.label}</Badge>
            </div>
          ) : null}

          <div className="sm:col-span-2 flex gap-2">
            {(["fistula", "graft"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccessType(t)}
                className={`rounded-full px-3 py-1 text-xs ${
                  accessType === t ? "bg-[var(--clinical-primary)] text-white" : "bg-[var(--clinical-muted)]"
                }`}
              >
                {t === "fistula" ? "Фистула" : "Шунт"}
              </button>
            ))}
          </div>
          <label className="text-sm">
            PSV в фистуле/шунте, см/с
            <Input className="mt-1" inputMode="decimal" value={shuntPsv} onChange={(e) => setShuntPsv(e.target.value)} />
          </label>
          <label className="text-sm">
            PSV в анастомозе, см/с
            <Input className="mt-1" inputMode="decimal" value={anastPsv} onChange={(e) => setAnastPsv(e.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2">
            Объёмный кровоток, мл/мин
            <Input className="mt-1" inputMode="decimal" value={volumeFlow} onChange={(e) => setVolumeFlow(e.target.value)} />
          </label>
          {avAccess ? (
            <div className="sm:col-span-2 rounded-2xl border border-[var(--clinical-border)] p-3">
              <Badge variant={avAccess.grade === "normal" ? "outline" : "destructive"}>{avAccess.label}</Badge>
              <ul className="mt-2 list-disc pl-5 text-xs text-[var(--clinical-foreground-muted)]">
                {avAccess.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Протокол §8.7
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="font-medium">Артерии</p>
          {UL_ARTERIAL_PROTOCOL_SECTIONS.map((sec) => (
            <ProtocolBlock key={sec.title} title={sec.title} fields={sec.fields} />
          ))}
          <p className="font-medium pt-2">Вены</p>
          {UL_VENOUS_PROTOCOL_SECTIONS.map((sec) => (
            <ProtocolBlock key={sec.title} title={sec.title} fields={sec.fields} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заключение §8.8</CardTitle>
          <CardDescription>{VASCULAR_US_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {UL_ALL_CONCLUSION_TEMPLATES.map((t) => (
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
                {t.system === "arterial" ? "А" : "В"} {t.number}. {t.label}
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
      <p className="text-[var(--clinical-foreground-muted)]">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
        {fields.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
