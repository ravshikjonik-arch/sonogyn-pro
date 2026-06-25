"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Activity, BookOpen, FileText, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CarotidStenosisResult } from "@/lib/ai/vascular-ultrasound/carotid-stenosis";
import {
  VASCULAR_PROTOCOL_CHECKLISTS,
  type VascularBasinId,
} from "@/lib/ai/vascular-ultrasound/protocol-checklists";
import { BcaProtocolPanel } from "@/components/assistant/BcaProtocolPanel";
import { AbdominalAortaProtocolPanel } from "@/components/assistant/AbdominalAortaProtocolPanel";
import { LowerLimbArteriesProtocolPanel } from "@/components/assistant/LowerLimbArteriesProtocolPanel";
import { LowerLimbVeinsProtocolPanel } from "@/components/assistant/LowerLimbVeinsProtocolPanel";
import { TcdProtocolPanel } from "@/components/assistant/TcdProtocolPanel";
import { UpperLimbProtocolPanel } from "@/components/assistant/UpperLimbProtocolPanel";
import { VASCULAR_US_DISCLAIMER } from "@/lib/education/vascular-ultrasound";

type VascularTabId =
  | "protocol"
  | "bca"
  | "tcd"
  | "lla"
  | "llv"
  | "ul"
  | "aaa"
  | "carotid"
  | "ai";

const VASCULAR_TAB_IDS: VascularTabId[] = [
  "protocol",
  "bca",
  "tcd",
  "lla",
  "llv",
  "ul",
  "aaa",
  "carotid",
  "ai",
];

function parseVascularTab(tab?: string): VascularTabId {
  if (tab && VASCULAR_TAB_IDS.includes(tab as VascularTabId)) {
    return tab as VascularTabId;
  }
  return "protocol";
}

type AssistMode = "clinical" | "teaching" | "report";

export function VascularUltrasoundAssistantClient({ defaultTab }: { defaultTab?: string }) {
  const [basin, setBasin] = useState<VascularBasinId>("extracranial");
  const [mode, setMode] = useState<AssistMode>("clinical");
  const [freeText, setFreeText] = useState("");
  const [psvIca, setPsvIca] = useState("");
  const [edvIca, setEdvIca] = useState("");
  const [psvCca, setPsvCca] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [carotidGrade, setCarotidGrade] = useState<CarotidStenosisResult | null>(null);
  const [pipeline, setPipeline] = useState("");

  const checklist = useMemo(
    () => VASCULAR_PROTOCOL_CHECKLISTS.find((p) => p.id === basin),
    [basin],
  );

  const runAssist = useCallback(async () => {
    setLoading(true);
    setResultText("");
    try {
      const res = await fetch("/api/ai/vascular-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode,
          basin,
          freeText: freeText.trim() || undefined,
          carotid:
            basin === "extracranial" && (psvIca || edvIca || psvCca)
              ? {
                  psvIcaCmS: psvIca ? Number(psvIca) : null,
                  edvIcaCmS: edvIca ? Number(edvIca) : null,
                  psvCcaCmS: psvCca ? Number(psvCca) : null,
                }
              : undefined,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        result?: {
          aiText?: string;
          carotidGrade?: CarotidStenosisResult;
          pipeline?: string;
        };
        error?: string;
      } | null;
      if (!res.ok) {
        setResultText(payload?.error ?? "Не удалось выполнить анализ.");
        return;
      }
      setResultText(payload?.result?.aiText ?? "");
      setCarotidGrade(payload?.result?.carotidGrade ?? null);
      setPipeline(payload?.result?.pipeline ?? "");
    } finally {
      setLoading(false);
    }
  }, [basin, edvIca, freeText, mode, psvCca, psvIca]);

  return (
    <Tabs defaultValue={parseVascularTab(defaultTab)} className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="protocol">Протокол</TabsTrigger>
        <TabsTrigger value="bca">Глава 4 · БЦА</TabsTrigger>
        <TabsTrigger value="tcd">Глава 5 · TCD</TabsTrigger>
        <TabsTrigger value="lla">Глава 6 · АНК</TabsTrigger>
        <TabsTrigger value="llv">Глава 7 · ВНК</TabsTrigger>
        <TabsTrigger value="ul">Глава 8 · ВК</TabsTrigger>
        <TabsTrigger value="aaa">Глава 9 · Аорта</TabsTrigger>
        <TabsTrigger value="carotid">Калькулятор БЦА</TabsTrigger>
        <TabsTrigger value="ai">AI · интерпретация</TabsTrigger>
      </TabsList>

      <TabsContent value="protocol" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-[var(--clinical-primary)]" />
              Стандарт исследования
            </CardTitle>
            <CardDescription>Куликов · методика + чеклист по бассейну</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {VASCULAR_PROTOCOL_CHECKLISTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setBasin(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    basin === p.id
                      ? "bg-[var(--clinical-primary)] text-white"
                      : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
            {checklist ? (
              <div className="space-y-3 text-sm">
                <p>
                  <Badge variant="outline">{checklist.kulikovChapter}</Badge>{" "}
                  <span className="text-[var(--clinical-foreground-muted)]">{checklist.indication}</span>
                </p>
                <SectionList title="Техника" items={checklist.technique} />
                <SectionList title="Морфология" items={checklist.morphology} />
                <SectionList title="Гемодинамика" items={checklist.hemodynamics} />
                {checklist.functionalTests ? (
                  <SectionList title="Функциональные пробы" items={checklist.functionalTests} />
                ) : null}
                <SectionList title="Структура заключения" items={checklist.reportSections} />
              </div>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/library/vascular-ultrasound">
                <BookOpen className="mr-2 h-4 w-4" />
                Образовательный курс →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bca">
        <BcaProtocolPanel />
      </TabsContent>

      <TabsContent value="tcd">
        <TcdProtocolPanel />
      </TabsContent>

      <TabsContent value="lla">
        <LowerLimbArteriesProtocolPanel />
      </TabsContent>

      <TabsContent value="llv">
        <LowerLimbVeinsProtocolPanel />
      </TabsContent>

      <TabsContent value="ul">
        <UpperLimbProtocolPanel />
      </TabsContent>

      <TabsContent value="aaa">
        <AbdominalAortaProtocolPanel />
      </TabsContent>

      <TabsContent value="carotid" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Градация стеноза ВСА
            </CardTitle>
            <CardDescription>PSV / EDV / ICA·CCA ratio (SVU consensus)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              PSV ВСА (см/с)
              <Input className="mt-1" inputMode="decimal" value={psvIca} onChange={(e) => setPsvIca(e.target.value)} />
            </label>
            <label className="text-sm">
              EDV ВСА (см/с)
              <Input className="mt-1" inputMode="decimal" value={edvIca} onChange={(e) => setEdvIca(e.target.value)} />
            </label>
            <label className="text-sm">
              PSV ОСА (см/с)
              <Input className="mt-1" inputMode="decimal" value={psvCca} onChange={(e) => setPsvCca(e.target.value)} />
            </label>
            <Button className="sm:col-span-3" disabled={loading} onClick={() => void runAssist()}>
              Рассчитать
            </Button>
            {carotidGrade ? (
              <div className="sm:col-span-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4 text-sm">
                <p className="font-semibold">
                  {carotidGrade.label} · {carotidGrade.percentRange}
                </p>
                <ul className="mt-2 list-disc pl-5 text-[var(--clinical-foreground-muted)]">
                  {carotidGrade.criteria.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[var(--clinical-foreground-muted)]">{carotidGrade.strokeRiskNote}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Сосудистый эксперт
            </CardTitle>
            <CardDescription>{VASCULAR_US_DISCLAIMER}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["clinical", "Клиника"],
                  ["teaching", "Обучение"],
                  ["report", "Заключение"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    mode === id ? "bg-[var(--clinical-primary)] text-white" : "bg-[var(--clinical-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Textarea
              rows={8}
              placeholder="Опишите находки, PSV/EDV, сторону, пробы… Или: «Разбери случай» / «Обучение» по главе 4."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
            <Button disabled={loading} onClick={() => void runAssist()}>
              {loading ? "Анализ…" : "Интерпретировать"}
            </Button>
            {pipeline ? (
              <p className="text-xs text-[var(--clinical-foreground-muted)]">Pipeline: {pipeline}</p>
            ) : null}
            {resultText ? (
              <div className="whitespace-pre-wrap rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-sm leading-relaxed">
                {resultText}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
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
