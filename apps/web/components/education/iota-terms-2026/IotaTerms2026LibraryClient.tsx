"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { IotaTerms2026SelfAssessmentWidget } from "@/components/education/iota-terms-2026/IotaTerms2026SelfAssessmentWidget";
import { IotaTerms2026Widget } from "@/components/education/iota-terms-2026/IotaTerms2026Widget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function IotaTerms2026LibraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "quiz" ? "quiz" : "reference";

  const onTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/library/iota-terms-2026?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="reference">Справочник · инфографика</TabsTrigger>
        <TabsTrigger value="quiz">Самопроверка · 12 Q</TabsTrigger>
      </TabsList>

      <TabsContent value="reference" className="mt-0">
        <IotaTerms2026Widget />
      </TabsContent>
      <TabsContent value="quiz" className="mt-0">
        <IotaTerms2026SelfAssessmentWidget />
      </TabsContent>
    </Tabs>
  );
}

export function IotaTerms2026LibraryClient() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>}>
      <IotaTerms2026LibraryInner />
    </Suspense>
  );
}
