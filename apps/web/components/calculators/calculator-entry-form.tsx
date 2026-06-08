"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import type { CalculatorDefinition } from "@/lib/calculators/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type CalculatorHistoryRow = {
  id: string;
  payload: Record<string, unknown>;
  summary: string | null;
  created_at: string;
};

export function CalculatorEntryForm({
  definition,
  history,
}: {
  definition: CalculatorDefinition;
  history: CalculatorHistoryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const initial = useMemo(() => {
    const o: Record<string, string> = {};
    definition.fields.forEach((f) => {
      o[f.key] = "";
    });
    return o;
  }, [definition]);

  const [values, setValues] = useState<Record<string, string>>(initial);

  function fieldChange(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSave() {
    const payload: Record<string, unknown> = {};
    definition.fields.forEach((f) => {
      const raw = values[f.key]?.trim() ?? "";
      if (f.type === "number") {
        payload[f.key] = raw === "" ? null : Number(raw);
      } else {
        payload[f.key] = raw;
      }
    });

    const summaryParts = definition.fields
      .filter((f) => f.key !== "notes")
      .map((f) => `${f.label}: ${payload[f.key]}`)
      .join(" · ");

    startTransition(() => {
      void saveCalculatorEntry({
        slug: definition.slug,
        calculatorCode: definition.code,
        payload,
        summary: summaryParts.slice(0, 480) || undefined,
      }).then((res) => {
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
        toast.success("Saved to Supabase");
        setValues(initial);
      });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
          <CardDescription>{definition.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {definition.fields.map((field) => (
            <label key={field.key} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
              {field.type === "select" && field.options ? (
                <select
                  className="flex h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 text-sm dark:bg-slate-950 dark:text-white"
                  value={values[field.key] ?? ""}
                  onChange={(e) => fieldChange(field.key, e.target.value)}
                >
                  <option value="">Select…</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => fieldChange(field.key, e.target.value)}
                />
              )}
            </label>
          ))}
          <Button type="button" disabled={pending} onClick={() => void onSave()}>
            {pending ? "Saving…" : "Save structured entry"}
          </Button>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Entries attach to your Supabase user via RLS. Replace payload validation with Zod + CDS rules for production.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 lg:max-h-[720px] lg:overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-base">Recent sessions</CardTitle>
          <CardDescription>Last {history.length} saves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No saved rows yet.</p>
          ) : (
            history.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{new Date(row.created_at).toLocaleString()}</Badge>
                </div>
                {row.summary ? (
                  <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">{row.summary}</p>
                ) : null}
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white p-2 text-[11px] leading-snug dark:bg-black">
                  {JSON.stringify(row.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
