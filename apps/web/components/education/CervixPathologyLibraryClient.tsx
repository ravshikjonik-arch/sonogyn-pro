"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { CervixPathologyReferenceWidget } from "@/components/education/CervixPathologyReferenceWidget";
import { CervixPathologySelfAssessmentWidget } from "@/components/education/CervixPathologySelfAssessmentWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CervixChapterId } from "@repo/cervix-pathology-reference";

const CHAPTER_IDS = new Set([
  "01-anatomy",
  "02-diagnostics",
  "03-benign-conditions",
  "04-treatment-methods",
  "05-special-populations",
  "06-precancerous",
  "07-cervical-cancer",
]);

function parseChapterId(raw: string | null): CervixChapterId | undefined {
  if (!raw || !CHAPTER_IDS.has(raw)) return undefined;
  return raw as CervixChapterId;
}

function CervixPathologyLibraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "quiz" ? "quiz" : "reference";
  const chapterId = parseChapterId(searchParams.get("chapter"));

  const onTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/library/cervix-pathology?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="reference">Справочник · 7 глав</TabsTrigger>
        <TabsTrigger value="quiz">Самопроверка · 16 Q</TabsTrigger>
      </TabsList>

      <TabsContent value="reference" className="mt-0">
        <CervixPathologyReferenceWidget initialChapterId={chapterId} />
      </TabsContent>
      <TabsContent value="quiz" className="mt-0">
        <CervixPathologySelfAssessmentWidget />
      </TabsContent>
    </Tabs>
  );
}

export function CervixPathologyLibraryClient() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>}>
      <CervixPathologyLibraryInner />
    </Suspense>
  );
}
