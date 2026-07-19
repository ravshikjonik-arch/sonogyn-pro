"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LEARNING_PATHS,
  loadLearningPathProgress,
  pathProgressPercent,
  setLearningPathStepDone,
  STEP_TYPE_LABELS,
  type LearningPath,
} from "@/lib/education/learning-paths/catalog";

export function LearningPathsClient() {
  const [activeId, setActiveId] = useState(LEARNING_PATHS[0]!.id);
  const [tick, setTick] = useState(0);

  const allProgress = useMemo(() => loadLearningPathProgress(), [tick]);
  const active = LEARNING_PATHS.find((p) => p.id === activeId)!;
  const pathProgress = allProgress[activeId] ?? {};
  const percent = pathProgressPercent(active, pathProgress);

  const toggleStep = useCallback(
    (stepId: string) => {
      setLearningPathStepDone(activeId, stepId, !pathProgress[stepId]);
      setTick((n) => n + 1);
    },
    [activeId, pathProgress],
  );

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("sonogyn:learning-paths-progress", refresh);
    window.addEventListener("storage", (e) => {
      if (e.key === "sonogyn:learning-paths:progress") refresh();
    });
    return () => window.removeEventListener("sonogyn:learning-paths-progress", refresh);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {LEARNING_PATHS.map((path) => {
          const p = allProgress[path.id] ?? {};
          const pct = pathProgressPercent(path, p);
          return (
            <Button
              key={path.id}
              variant={path.id === activeId ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveId(path.id)}
              className="gap-1"
            >
              {path.titleRu.split("·")[0]?.trim()}
              {pct > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {pct}%
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <PathCard path={active} progress={pathProgress} percent={percent} onToggleStep={toggleStep} />
    </div>
  );
}

function PathCard({
  path,
  progress,
  percent,
  onToggleStep,
}: {
  path: LearningPath;
  progress: Record<string, boolean>;
  percent: number;
  onToggleStep: (stepId: string) => void;
}) {
  const totalMinutes = path.steps.reduce((n, s) => n + (s.estimatedMinutes ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-[var(--clinical-primary)]" />
              {path.titleRu}
            </CardTitle>
            <CardDescription>{path.description}</CardDescription>
            <Badge variant="outline">{path.badge}</Badge>
          </div>
          {totalMinutes > 0 && (
            <span className="text-xs text-[var(--clinical-foreground-muted)]">~{totalMinutes} мин</span>
          )}
        </div>
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-sm">
            <span>Прогресс</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {path.steps.map((step, index) => {
            const done = Boolean(progress[step.id]);
            return (
              <li
                key={step.id}
                className="flex gap-3 rounded-lg border border-[var(--clinical-border)] p-3"
              >
                <button type="button" onClick={() => onToggleStep(step.id)} className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--clinical-foreground-muted)]" />
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[var(--clinical-foreground-muted)]">
                      {index + 1}.
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {STEP_TYPE_LABELS[step.type]}
                    </Badge>
                    {step.estimatedMinutes && (
                      <span className="text-[10px] text-[var(--clinical-foreground-muted)]">
                        ~{step.estimatedMinutes} мин
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${done ? "line-through opacity-60" : ""}`}>{step.title}</p>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{step.description}</p>
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link href={step.href}>Открыть →</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
