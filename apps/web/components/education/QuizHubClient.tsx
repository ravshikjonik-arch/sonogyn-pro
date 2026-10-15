"use client";

import { GraduationCap, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  filterQuizHubEntries,
  type QuizHubPersona,
} from "@/lib/education/quiz-hub-registry";
import { cn } from "@/lib/utils/cn";

const PERSONA_CHIPS: { id: QuizHubPersona | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "doctor", label: "Врач" },
  { id: "intern", label: "Ординатор" },
  { id: "student", label: "Студент" },
];

export function QuizHubClient() {
  const [query, setQuery] = useState("");
  const [persona, setPersona] = useState<QuizHubPersona | "all">("all");

  const entries = useMemo(
    () => filterQuizHubEntries({ query, persona }),
    [query, persona],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: O-RADS, шейка, плод, IOTA…"
          className="max-w-md"
          aria-label="Поиск задач"
        />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Персона">
          {PERSONA_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={persona === chip.id}
              onClick={() => setPersona(chip.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                persona === chip.id
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                  : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Формат: обезличенный контекст · варианты ответов · объяснение · источник. Не заменяет клиническое
        суждение.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Card className="h-full border-[var(--clinical-border)] transition hover:border-[var(--clinical-primary)]/40">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {entry.difficulty === "doctor" ? "Врач" : "Базовый"}
                  </Badge>
                  {entry.questionCount ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {entry.questionCount} вопр.
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="text-base leading-snug">{entry.title}</CardTitle>
                <CardDescription>{entry.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.sourceLabel ? (
                  <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
                    Источники: {entry.sourceLabel}
                  </p>
                ) : null}
                <Link
                  href={entry.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--clinical-primary-muted)] px-4 py-2 text-sm font-semibold text-[var(--clinical-primary-deep)] hover:opacity-90"
                >
                  {entry.id.includes("case") ? (
                    <Stethoscope className="h-4 w-4" aria-hidden />
                  ) : (
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  )}
                  Открыть →
                </Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Ничего не найдено — смените фильтр.</p>
      ) : null}
    </div>
  );
}
