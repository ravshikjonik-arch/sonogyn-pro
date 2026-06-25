"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Droplets, FileText, Waves } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildLlvConclusionDraft,
  LLV_CONCLUSION_TEMPLATES,
  LLV_FUNCTIONAL_TESTS,
  LLV_PROTOCOL_TABLE_SECTIONS,
  LLV_SCANNING_ROUTE,
  type LlvConclusionTemplateId,
  type LlvSide,
  sideLabelLlv,
} from "@/lib/ai/vascular-ultrasound/lower-limb-veins-protocol";
import {
  gradeVenousReflux,
  LOWER_LIMB_VENOUS_NORMS,
  type VenousRefluxSegment,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

const REFLUX_SEGMENTS: { id: VenousRefluxSegment; label: string }[] = [
  { id: "superficial", label: "БПВ/МПВ" },
  { id: "femoral", label: "Бедренные" },
  { id: "popliteal", label: "ПкВ" },
  { id: "calf", label: "Берцовые" },
  { id: "perforator", label: "Перфорант" },
];

export function LowerLimbVeinsProtocolPanel() {
  const [side, setSide] = useState<LlvSide>("right");
  const [selectedTemplates, setSelectedTemplates] = useState<LlvConclusionTemplateId[]>(["normal"]);
  const [refluxDuration, setRefluxDuration] = useState("");
  const [refluxVelocity, setRefluxVelocity] = useState("");
  const [refluxSegment, setRefluxSegment] = useState<VenousRefluxSegment>("superficial");
  const [diameter, setDiameter] = useState("");

  const refluxGrade = useMemo(() => {
    const d = Number(refluxDuration);
    if (!refluxDuration || Number.isNaN(d)) return null;
    return gradeVenousReflux({
      durationSec: d,
      segment: refluxSegment,
      initialVelocityCmS: refluxVelocity ? Number(refluxVelocity) : null,
    });
  }, [refluxDuration, refluxSegment, refluxVelocity]);

  const phlebectasia = useMemo(() => {
    const mm = Number(diameter);
    if (!diameter || Number.isNaN(mm)) return null;
    const n = LOWER_LIMB_VENOUS_NORMS;
    if (mm <= n.saphenousPhlebectasiaMaxMm) {
      return { label: "В пределах нормы", variant: "outline" as const };
    }
    if (mm <= n.perforatorPhlebectasiaMaxMm + 0.5) {
      return { label: "Флебэктазия перфоранта", variant: "secondary" as const };
    }
    return { label: "Флебэктазия БПВ/МПВ", variant: "destructive" as const };
  }, [diameter]);

  const conclusionDraft = useMemo(
    () =>
      buildLlvConclusionDraft(
        selectedTemplates.map((id) => ({
          templateId: id,
          fill: {
            side: sideLabelLlv(side),
            durationSec: refluxDuration || undefined,
            velocityCmS: refluxVelocity || undefined,
            diameterMm: diameter || undefined,
          },
        })),
      ),
    [diameter, refluxDuration, refluxVelocity, selectedTemplates, side],
  );

  const toggleTemplate = (id: LlvConclusionTemplateId) => {
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
            <Droplets className="h-5 w-5 text-[var(--clinical-primary)]" />
            Вены нижних конечностей · гл. 7
          </CardTitle>
          <CardDescription>
            ТГВ · рефлюкс · ПТБ · кава-фильтр — по Куликову (2015)
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
                {sideLabelLlv(s)}
              </button>
            ))}
          </div>

          <Section title="Маршрут §7.3.1" items={[...LLV_SCANNING_ROUTE]} />
          <Section title="Пробы §7.3.2" items={[...LLV_FUNCTIONAL_TESTS]} />

          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-4">
            <p className="font-medium">Нормы и пороги</p>
            <ul className="mt-2 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
              <li>
                БПВ/МПВ ≤{LOWER_LIMB_VENOUS_NORMS.saphenousPhlebectasiaMaxMm} мм; перфоранты ≤
                {LOWER_LIMB_VENOUS_NORMS.perforatorPhlebectasiaMaxMm} мм
              </li>
              <li>
                Рефлюкс: поверхн./берц./перфор. &gt;
                {LOWER_LIMB_VENOUS_NORMS.refluxSuperficialSignificantSec} с; бедро/ПкВ &gt;
                {LOWER_LIMB_VENOUS_NORMS.refluxDeepFemoralSignificantSec} с
              </li>
              <li>
                Короткий &lt;{LOWER_LIMB_VENOUS_NORMS.refluxProlongedSec} с vs продолжительный ≥
                {LOWER_LIMB_VENOUS_NORMS.refluxProlongedSec} с; V &gt;
                {LOWER_LIMB_VENOUS_NORMS.refluxHighVelocityCmS} см/с — высокоскоростной
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Калькулятор рефлюкса
          </CardTitle>
          <CardDescription>Cloviczki / SVS · длительность + сегмент + Vmax</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm sm:col-span-3">
            Сегмент
            <div className="mt-1 flex flex-wrap gap-1">
              {REFLUX_SEGMENTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setRefluxSegment(s.id)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    refluxSegment === s.id
                      ? "bg-[var(--clinical-primary)] text-white"
                      : "bg-[var(--clinical-muted)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </label>
          <label className="text-sm">
            Длительность, с
            <Input
              className="mt-1"
              inputMode="decimal"
              placeholder="0.8"
              value={refluxDuration}
              onChange={(e) => setRefluxDuration(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Vmax рефлюкса, см/с
            <Input
              className="mt-1"
              inputMode="decimal"
              placeholder="25"
              value={refluxVelocity}
              onChange={(e) => setRefluxVelocity(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Диаметр вены, мм
            <Input
              className="mt-1"
              inputMode="decimal"
              placeholder="4.5"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
            />
          </label>
          {refluxGrade ? (
            <div className="sm:col-span-3 rounded-2xl border border-[var(--clinical-border)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={refluxGrade.significant ? "destructive" : "outline"}>
                  {refluxGrade.label}
                </Badge>
                {phlebectasia ? <Badge variant={phlebectasia.variant}>{phlebectasia.label}</Badge> : null}
              </div>
              <ul className="mt-2 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
                {refluxGrade.criteria.map((c) => (
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
            Протокол §7.8
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {LLV_PROTOCOL_TABLE_SECTIONS.map((sec) => (
            <div key={sec.title}>
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
          <CardTitle>Заключение §7.9</CardTitle>
          <CardDescription>{VASCULAR_US_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {LLV_CONCLUSION_TEMPLATES.map((t) => (
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
