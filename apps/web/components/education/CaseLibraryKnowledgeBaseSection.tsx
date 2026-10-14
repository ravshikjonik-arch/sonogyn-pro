"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  title: string;
  confirmed_diagnosis?: string | null;
  anatomy?: string | null;
};

export function CaseLibraryKnowledgeBaseSection() {
  const [cases, setCases] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      feedMode: "library",
      knowledgeBase: "1",
      limit: "8",
    });
    void fetch(`/api/cases?${params.toString()}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return [];
        const json = (await res.json()) as { cases?: Row[] };
        return json.cases ?? [];
      })
      .then((rows) => {
        if (!cancelled) setCases(rows);
      })
      .catch(() => {
        if (!cancelled) setCases([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && cases.length === 0) return null;

  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-blue-600 text-blue-900">
            База знаний
          </Badge>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-[var(--clinical-primary)]" aria-hidden />
            Подтверждённые учебные кейсы
          </CardTitle>
        </div>
        <CardDescription>
          Кейсы с экспертным подтверждением, опубликованные модератором в базу знаний (без PHI).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="block rounded-xl border border-[var(--clinical-border)] p-3 transition hover:bg-[var(--clinical-muted)]"
                >
                  <span className="text-sm font-semibold text-[var(--clinical-foreground)]">{c.title}</span>
                  {c.confirmed_diagnosis ? (
                    <span className="mt-1 block text-xs text-emerald-800">✓ {c.confirmed_diagnosis}</span>
                  ) : null}
                  {c.anatomy ? (
                    <span className="mt-0.5 block text-[10px] uppercase text-[var(--clinical-foreground-muted)]">
                      {c.anatomy}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href="/cases?tab=cases&knowledgeBase=1">Все кейсы базы знаний →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
