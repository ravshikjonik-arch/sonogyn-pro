"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CareerPathWidget } from "@/components/career/CareerPathWidget";
import type { CareerProgress } from "@/lib/career/ladder";
import { buildCareerProgress } from "@/lib/career/resolve-stage";

/** Клиентский виджет для paywall — подтягивает актуальный прогресс. */
export function PaywallCareerBanner() {
  const [progress, setProgress] = useState<CareerProgress>(() => buildCareerProgress(null, true));

  useEffect(() => {
    void fetch("/api/career/progress", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: { progress?: CareerProgress }) => {
        if (body.progress) setProgress(body.progress);
      })
      .catch(() => undefined);
  }, []);

  if (progress.currentStage === "pro") return null;

  return (
    <div className="space-y-3">
      <CareerPathWidget progress={progress} variant="compact" />
      <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
        Уже прошли путь студент → врач?{" "}
        <Link href="/app" className="font-medium text-[var(--clinical-primary-deep)] hover:underline">
          Вернуться в кабинет
        </Link>
      </p>
    </div>
  );
}
