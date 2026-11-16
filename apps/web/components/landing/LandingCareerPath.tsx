"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { CareerPathWidget } from "@/components/career/CareerPathWidget";
import { buildCareerProgress } from "@/lib/career/resolve-stage";
import type { CareerProgress } from "@/lib/career/ladder";
import { Button } from "@/components/ui/button";

type LandingCareerPathProps = {
  isAuthenticated: boolean;
};

/** Витрина пути студент → PRO — мотивация продолжать. Progress hydrates client-side (TTFB). */
export function LandingCareerPath({ isAuthenticated }: LandingCareerPathProps) {
  const [progress, setProgress] = useState<CareerProgress | undefined>();

  useEffect(() => {
    if (!isAuthenticated) {
      setProgress(undefined);
      return;
    }
    let cancelled = false;
    void fetch("/api/career/progress", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { ok?: boolean; progress?: CareerProgress };
      })
      .then((data) => {
        if (cancelled || !data?.progress) return;
        setProgress(data.progress);
      })
      .catch(() => {
        /* keep guest/authenticated fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const guestPitch: CareerProgress = {
    ...buildCareerProgress(null, false),
    headline: "От студента — к ординатору, врачу и PRO",
    subline:
      "Четыре понятных шага: сначала бесплатно, потом кабинет, потом практика, потом подписка без лимитов.",
    ctaLabel: "Открыть кабинет — без регистрации",
    ctaHref: "/app",
  };

  const displayProgress = progress ?? (isAuthenticated ? buildCareerProgress(null, true) : guestPitch);

  return (
    <section id="career-path" className="scroll-mt-24">
      <CareerPathWidget progress={displayProgress} />
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-[var(--clinical-foreground-muted)]">
        Инструмент ассистивный. Заключение и решение — за лечащим врачом.
      </p>
      {!isAuthenticated ? (
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/login">
              Уже учусь / работаю — войти
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
