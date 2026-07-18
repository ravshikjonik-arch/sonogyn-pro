"use client";

import { BookOpen, ClipboardList, Layers, Map, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  generateAdenomyosisReport,
  getDirectFeatures,
  getIndirectFeatures,
  getSlides,
  MUSA_ADENOMYOSIS_KNOWLEDGE,
  MUSA_FRAMEWORK_MODULES,
  type MusaAdenomyosisAssessmentInput,
  type MusaAdenomyosisReport,
  type MusaDepthCode,
  type MusaLocalizationCode,
} from "@repo/musa-framework";

import { AutoReportPreview } from "@/components/musa/AutoReportPreview";
import { FeatureCard } from "@/components/musa/FeatureCard";
import { JunctionalZoneCard } from "@/components/musa/JunctionalZoneCard";
import { LocalizationMap } from "@/components/musa/LocalizationMap";
import { MusaCard } from "@/components/musa/MusaCard";
import { MusaTerminologyGuide } from "@/components/musa/MusaTerminologyGuide";
import { ScoreCalculator } from "@/components/musa/ScoreCalculator";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_INPUT: MusaAdenomyosisAssessmentInput = {
  myometrialCysts: false,
  hyperechogenicIslands: false,
  subendometrialStriations: false,
  heterogeneousMyometrium: false,
  asymmetry: false,
  globularUterus: false,
  fanShapedShadowing: false,
  jzThicknessMm: null,
  localization: [],
};

export function MusaAdenomyosisClient() {
  const [input, setInput] = useState<MusaAdenomyosisAssessmentInput>(DEFAULT_INPUT);
  const [jzMm, setJzMm] = useState("");
  const [jzIrregularity, setJzIrregularity] = useState<"" | "JZ-I" | "JZ-II" | "JZ-III">("");
  const [depth, setDepth] = useState<MusaDepthCode | "">("");
  const [morphotype, setMorphotype] = useState<MusaAdenomyosisAssessmentInput["morphologicType"] | "">("");
  const [report, setReport] = useState<MusaAdenomyosisReport | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  const slides = useMemo(() => getSlides(), []);
  const scoreInput = useMemo(
    () => ({
      ...input,
      jzThicknessMm: jzMm.trim() ? Number.parseFloat(jzMm) : null,
    }),
    [input, jzMm],
  );

  const toggleFlag = (key: keyof MusaAdenomyosisAssessmentInput) => {
    setInput((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buildReport = () => {
    const full: MusaAdenomyosisAssessmentInput = {
      ...scoreInput,
      jzIrregularity: jzIrregularity || undefined,
      depthOfInvasion: depth || undefined,
      morphologicType: morphotype || undefined,
      localization: input.localization,
    };
    setReport(generateAdenomyosisReport(full));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <ClinicalAssistStrip
        context={{
          title: "MUSA · Аденомиоз",
          mode: "gynecology",
          voiceProfile: "general",
          ultrasoundFocus: ["MUSA", "JZ", "myometrium", "structured report"],
        }}
        compact
      />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{MUSA_ADENOMYOSIS_KNOWLEDGE.moduleRu}</h1>
          <Badge variant="outline">MUSA</Badge>
          <Badge variant="secondary">Sonogyn Score</Badge>
        </div>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {MUSA_ADENOMYOSIS_KNOWLEDGE.introduction.definition} · {MUSA_ADENOMYOSIS_KNOWLEDGE.disclaimer.ru}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {MUSA_FRAMEWORK_MODULES.filter((m) => m.status === "ready").map((m) =>
            m.route ? (
              <Link key={m.id} href={m.route} className="rounded-full bg-[var(--clinical-muted)] px-2 py-1 hover:underline">
                {m.titleRu}
              </Link>
            ) : null,
          )}
        </div>
      </header>

      <Tabs defaultValue="terminology">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="terminology" className="gap-1">
            <MessageSquareText className="h-4 w-4" /> Терминология
          </TabsTrigger>
          <TabsTrigger value="learn" className="gap-1">
            <BookOpen className="h-4 w-4" /> Слайды
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1">
            <Layers className="h-4 w-4" /> Признаки
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1">
            <Map className="h-4 w-4" /> Карта
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1">
            <ClipboardList className="h-4 w-4" /> Протокол
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminology" className="pt-4">
          <MusaTerminologyGuide />
        </TabsContent>

        <TabsContent value="learn" className="space-y-4 pt-4">
          <MusaCard title={slides[slideIdx]?.title ?? "MUSA"} badge={`Слайд ${slideIdx + 1}/${slides.length}`}>
            {slides[slideIdx]?.blocks.map((block) => (
              <div key={block.heading} className="mb-4">
                <p className="text-sm font-semibold">{block.heading}</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" disabled={slideIdx === 0} onClick={() => setSlideIdx((i) => i - 1)}>
                Назад
              </Button>
              <Button variant="outline" disabled={slideIdx >= slides.length - 1} onClick={() => setSlideIdx((i) => i + 1)}>
                Далее
              </Button>
            </div>
          </MusaCard>
          <MusaCard title="Цели обучения">
            <ul className="list-disc pl-5 text-sm">
              {MUSA_ADENOMYOSIS_KNOWLEDGE.introduction.learningObjectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </MusaCard>
        </TabsContent>

        <TabsContent value="features" className="space-y-6 pt-4">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Прямые признаки MUSA
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {getDirectFeatures().map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  active={
                    (f.id === "myometrial-cysts" && input.myometrialCysts) ||
                    (f.id === "hyperechogenic-islands" && input.hyperechogenicIslands) ||
                    (f.id === "subendometrial-striations" && input.subendometrialStriations)
                  }
                  onToggle={() => {
                    if (f.id === "myometrial-cysts") toggleFlag("myometrialCysts");
                    if (f.id === "hyperechogenic-islands") toggleFlag("hyperechogenicIslands");
                    if (f.id === "subendometrial-striations") toggleFlag("subendometrialStriations");
                  }}
                />
              ))}
            </div>
          </section>
          <JunctionalZoneCard
            thicknessMm={jzMm}
            onThicknessChange={setJzMm}
            irregularity={jzIrregularity}
            onIrregularityChange={setJzIrregularity}
          />
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Косвенные признаки
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {getIndirectFeatures().map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  active={
                    (f.id === "heterogeneous-myometrium" && input.heterogeneousMyometrium) ||
                    (f.id === "fan-shaped-shadowing" && input.fanShapedShadowing) ||
                    (f.id === "asymmetric-thickening" && input.asymmetry) ||
                    (f.id === "globular-uterus" && input.globularUterus)
                  }
                  onToggle={() => {
                    if (f.id === "heterogeneous-myometrium") toggleFlag("heterogeneousMyometrium");
                    if (f.id === "fan-shaped-shadowing") toggleFlag("fanShapedShadowing");
                    if (f.id === "asymmetric-thickening") toggleFlag("asymmetry");
                    if (f.id === "globular-uterus") toggleFlag("globularUterus");
                  }}
                />
              ))}
            </div>
          </section>
          <ScoreCalculator input={scoreInput} />
        </TabsContent>

        <TabsContent value="map" className="space-y-4 pt-4">
          <LocalizationMap
            selected={(input.localization ?? []) as MusaLocalizationCode[]}
            onChange={(localization) => setInput((prev) => ({ ...prev, localization }))}
          />
          <MusaCard title="Глубина инвазии · Тип">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="depth" className="mb-1 block text-sm font-medium">
                  Глубина (A0–A4)
                </label>
                <select
                  id="depth"
                  className="flex h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value as MusaDepthCode | "")}
                >
                  <option value="">—</option>
                  {MUSA_ADENOMYOSIS_KNOWLEDGE.depthOfInvasion.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}: {d.labelRu}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="morph" className="mb-1 block text-sm font-medium">
                  Морфологический тип
                </label>
                <select
                  id="morph"
                  className="flex h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
                  value={morphotype}
                  onChange={(e) =>
                    setMorphotype(e.target.value as MusaAdenomyosisAssessmentInput["morphologicType"] | "")
                  }
                >
                  <option value="">—</option>
                  {MUSA_ADENOMYOSIS_KNOWLEDGE.adenomyosisTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code}-Type: {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </MusaCard>
        </TabsContent>

        <TabsContent value="report" className="space-y-4 pt-4">
          <Button onClick={buildReport} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Сформировать протокол MUSA
          </Button>
          <AutoReportPreview report={report} />
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tools/mapping/uterus" className="text-[var(--clinical-primary)] hover:underline">
              FIGO / 3D матка →
            </Link>
            <Link href="/tools/mapping/endometriosis" className="text-[var(--clinical-primary)] hover:underline">
              IDEA · глубокий эндометриоз →
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
