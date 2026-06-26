"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ANATOMY_REGIONS,
  GYN_CORRELATIONS,
  HEAD_NECK_LEVELS,
  LN_ASSESSMENT_QUESTIONS,
  THYROID_CANCER_TYPES,
  atlasImageUrl,
} from "@/lib/ln-rads-us";

const MODULES = [
  ["head_neck", "Head & Neck"],
  ["thyroid", "Щитовидная"],
  ["breast", "Молочная"],
  ["gynecologic", "Гинекология"],
] as const;

export function LnRadsAnatomyMap() {
  const [module, setModule] = useState<(typeof MODULES)[number][0]>("head_neck");

  const regions = useMemo(
    () =>
      ANATOMY_REGIONS.filter(
        (r) => !r.module || r.module === module || (module === "head_neck" && r.id.startsWith("level_")),
      ),
    [module],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {MODULES.map(([id, label]) => (
          <CalcChip key={id} label={label} selected={module === id} onClick={() => setModule(id)} />
        ))}
      </div>

      {module === "head_neck" ? (
        <CalcStepCard title="Уровни шеи I–VII (ATA / SRU)">
          <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-xl bg-slate-900">
            <Image
              src="/images/lymphnodes/neck_levels_map.svg"
              alt="Схема уровней шейных лимфоузлов I–VII"
              fill
              className="object-contain p-2"
              sizes="400px"
            />
          </div>
          <ul className="mt-4 list-inside list-disc text-sm">
            {HEAD_NECK_LEVELS.map((l) => (
              <li key={l.id}>{l.label}</li>
            ))}
          </ul>
        </CalcStepCard>
      ) : null}

      {module === "thyroid" ? (
        <CalcStepCard title="Типы рака щитовидной железы и паттерн ЛУ">
          {THYROID_CANCER_TYPES.map((t) => (
            <div key={t.id} className="mb-2 text-sm">
              <p className="font-bold">{t.nameRu}</p>
              <p className="text-[var(--clinical-foreground-muted)]">{t.lnPattern}</p>
            </div>
          ))}
        </CalcStepCard>
      ) : null}

      {module === "breast" ? (
        <CalcStepCard title="Подмышечные ЛУ и BI-RADS">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Округлый узел, eccentric cortex, утрата hilum — коррелировать с первичной опухолью молочной железы.
            Sentinel node mapping при cN0.
          </p>
        </CalcStepCard>
      ) : null}

      {module === "gynecologic" ? (
        <CalcStepCard title="Гинекологические корреляции">
          {GYN_CORRELATIONS.map((g) => (
            <p key={g.cancer} className="text-sm">
              <span className="font-bold">{g.cancer}:</span> {g.nodes}
            </p>
          ))}
        </CalcStepCard>
      ) : null}

      <div className="space-y-3">
        {regions.map((r) => (
          <article key={r.id} className="clinical-surface rounded-xl border p-3 text-sm">
            <h3 className="font-black">{r.labelRu}</h3>
            <p className="mt-1">
              <span className="font-bold">Анатомия:</span> {r.normalAnatomy}
            </p>
            <p>
              <span className="font-bold">Дренаж:</span> {r.drainageTerritories}
            </p>
            <p>
              <span className="font-bold">Метастатические паттерны:</span> {r.metastaticPatterns}
            </p>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{r.recommendations}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const IMAGE_BY_QUESTION: Record<string, string> = {
  q4: "spiculated_malignant_node.svg",
};

export function LnRadsBoardTrainer() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const q = LN_ASSESSMENT_QUESTIONS[idx % LN_ASSESSMENT_QUESTIONS.length]!;
  const revealed = picked !== null;
  const imageFile = q.imageFile ?? IMAGE_BY_QUESTION[q.id];

  function pickOption(i: number) {
    if (revealed) return;
    setPicked(i);
    setScore((s) => ({
      correct: s.correct + (i === q.correctIndex ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function go(delta: number) {
    setPicked(null);
    setIdx((n) => (n + delta + LN_ASSESSMENT_QUESTIONS.length) % LN_ASSESSMENT_QUESTIONS.length);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline">
          {q.type.toUpperCase()} · {q.topic}
        </Badge>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Счёт: {score.correct}/{score.total}
        </p>
      </div>

      {q.type === "image" && imageFile ? (
        <div className="relative mx-auto aspect-[16/10] max-w-lg overflow-hidden rounded-xl bg-slate-900">
          <Image
            src={atlasImageUrl(imageFile)}
            alt="УЗ-изображение для вопроса"
            fill
            className="object-contain p-2"
            sizes="512px"
          />
        </div>
      ) : null}

      <CalcStepCard title={q.questionRu}>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <Button
              key={opt}
              type="button"
              variant={revealed ? (i === q.correctIndex ? "default" : picked === i ? "destructive" : "outline") : "outline"}
              className="h-auto w-full justify-start whitespace-normal py-2 text-left text-sm"
              onClick={() => pickOption(i)}
            >
              {opt}
            </Button>
          ))}
        </div>
        {revealed ? (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {picked === q.correctIndex ? "✓ Верно. " : "✗ Неверно. "}
            {q.explanationRu}
          </p>
        ) : null}
      </CalcStepCard>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => go(-1)}>
          ← Назад
        </Button>
        <Button type="button" onClick={() => go(1)}>
          Далее →
        </Button>
      </div>
    </div>
  );
}
