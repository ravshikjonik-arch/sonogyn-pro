import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Route } from "lucide-react";

import { LearningPathsClient } from "@/components/education/LearningPathsClient";
import { LEARNING_PATHS } from "@/lib/education/learning-paths/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Learning Paths · ISUOG One-stop",
  description:
    "Обучающие маршруты: гайдлайн → калькулятор → quiz → кейс. 5 curated paths для O-RADS, FMF, FGR, шейка, 22 среза.",
};

export default function LearningPathsPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Библиотека
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">ISUOG One-stop</Badge>
              <Badge variant="outline">{LEARNING_PATHS.length} маршрутов</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Route className="h-8 w-8 text-[var(--clinical-primary)]" />
              Learning Paths
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Связанные маршруты обучения: гайдлайн → инструмент → quiz → кейс. Отмечайте пройденные шаги и
              отслеживайте прогресс.
            </p>
          </div>
        </header>

        <LearningPathsClient />
      </div>
    </div>
  );
}
