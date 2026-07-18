"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Award, Plus, RefreshCw } from "lucide-react";

import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { buildCmeCertificateSpec } from "@/lib/education/build-cme-certificate-spec";
import { syncLearningPathsToCme } from "@/lib/education/cme-auto-sync";

const CME_STORAGE_KEY = "sonogyn:cme-tracker:entries";

export type CmeEntry = {
  id: string;
  title: string;
  hours: number;
  date: string;
  source: string;
};

function loadEntries(): CmeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CME_STORAGE_KEY) ?? "[]") as CmeEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: CmeEntry[]): void {
  localStorage.setItem(CME_STORAGE_KEY, JSON.stringify(entries));
}

export function CmeTrackerClient() {
  const [entries, setEntries] = useState<CmeEntry[]>([]);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("1");
  const [source, setSource] = useState("SonoGyn Pro");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    syncLearningPathsToCme();
    setEntries(loadEntries());
    setMounted(true);
    const refresh = () => setEntries(loadEntries());
    window.addEventListener("sonogyn:cme-updated", refresh);
    return () => window.removeEventListener("sonogyn:cme-updated", refresh);
  }, []);

  const totalHours = useMemo(() => entries.reduce((n, e) => n + e.hours, 0), [entries]);
  const targetHours = 36;
  const percent = Math.min(100, Math.round((totalHours / targetHours) * 100));
  const certificateSpec = useMemo(
    () => buildCmeCertificateSpec(entries, { totalTargetHours: targetHours }),
    [entries, targetHours],
  );

  function addEntry() {
    const h = parseFloat(hours);
    if (!title.trim() || !h || h <= 0) return;
    const next: CmeEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      hours: h,
      date: new Date().toISOString().slice(0, 10),
      source: source.trim() || "SonoGyn Pro",
    };
    const updated = [next, ...entries];
    saveEntries(updated);
    setEntries(updated);
    setTitle("");
    setHours("1");
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Прогресс · {totalHours.toFixed(1)} / {targetHours} ч (ориентир)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={percent} className="h-3" />
          <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
            Локальный трекер часов обучения (не аккредитованный НМО). Learning paths зачисляются автоматически.
          </p>
          {certificateSpec ? (
            <div className="mt-3">
              <DocumentExportToolbar spec={certificateSpec} compact />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const added = syncLearningPathsToCme();
            setEntries(loadEntries());
            if (added > 0) return;
          }}
        >
          <RefreshCw className="mr-1 h-4 w-4" /> Синхр. Learning Paths
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Название (курс, вебинар, quiz…)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Input
          type="number"
          step="0.5"
          min="0.5"
          placeholder="Часы"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-24"
        />
        <Input placeholder="Источник" value={source} onChange={(e) => setSource(e.target.value)} className="w-40" />
        <Button onClick={addEntry}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span>
              {e.title} · <Badge variant="outline">{e.hours} ч</Badge>
            </span>
            <span className="text-xs text-[var(--clinical-foreground-muted)]">
              {e.date} · {e.source}
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Добавьте часы после курса, вебинара или learning path.
          </p>
        )}
      </ul>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/tools/refs/learning-paths" className="text-[var(--clinical-primary)] underline">
          Learning Paths
        </Link>
        <Link href="/tools/refs/webinars" className="text-[var(--clinical-primary)] underline">
          Вебинары
        </Link>
      </div>
    </div>
  );
}
