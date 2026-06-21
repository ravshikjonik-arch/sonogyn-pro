"use client";

import {
  formatFigoSonoGynBlock,
  getFigoAtlasEntryForType,
  getFigoColor,
  type FigoVariantCode,
} from "@repo/clinical-3d";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FigoUsSchematic } from "./FigoUsSchematic";

export function FigoResultCard({
  figoType,
  figoVariant,
  localizationRu,
  mode = "clinical",
}: {
  figoType: number;
  figoVariant?: FigoVariantCode | null;
  localizationRu?: string;
  mode?: "clinical" | "education";
}) {
  const entry = getFigoAtlasEntryForType(figoType, figoVariant ?? null);
  const displayCode = figoVariant ?? String(figoType);

  return (
    <Card className="border-violet-200/80 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/20">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge style={{ backgroundColor: getFigoColor(String(figoType) as "0") }}>{entry.title}</Badge>
          {figoVariant ? <Badge variant="outline">подтип {figoVariant}</Badge> : null}
          <Badge variant="outline">{mode === "clinical" ? "Рабочий режим" : "Учебный режим"}</Badge>
        </div>
        <CardTitle className="text-base">{entry.localization}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="overflow-hidden rounded-xl border border-black bg-black">
          <FigoUsSchematic code={displayCode} size={140} className="w-full" />
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-slate-800 dark:text-slate-100">{entry.summaryRu}</p>
          {localizationRu ? (
            <p className="text-xs text-slate-600 dark:text-slate-400">Локализация: {localizationRu}</p>
          ) : null}
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {formatFigoSonoGynBlock(entry)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
