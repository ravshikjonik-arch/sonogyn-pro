import { BookOpen, GraduationCap, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFetalDopplerFirstTrimesterEducationalLink } from "@/lib/clinical-assistant/first-trimester-doppler";
import { cn } from "@/lib/utils/cn";

type FetalDopplerEducationalLinkPanelProps = {
  variant?: "inline" | "card";
  className?: string;
};

/** Баннер связи FMF / ISUOG ↔ модуль допплера I тримestra. */
export function FetalDopplerEducationalLinkPanel({
  variant = "card",
  className,
}: FetalDopplerEducationalLinkPanelProps) {
  const { lecture, moduleHref, courseHref } = getFetalDopplerFirstTrimesterEducationalLink();
  if (!lecture) return null;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-indigo-50/50 p-4 dark:border-sky-900/50 dark:from-sky-950/30 dark:to-indigo-950/20",
          className,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Stethoscope className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              <p className="text-sm font-bold text-sky-950 dark:text-sky-100">Образовательный модуль</p>
              <Badge variant="outline" className="border-sky-300 text-sky-800">
                ISUOG · лекция {lecture.number}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-sky-950/90 dark:text-sky-100/90">
              {lecture.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={moduleHref}>
                <BookOpen className="mr-2 h-4 w-4" />
                5 позиций допплера
              </Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href={courseHref}>Программа ISUOG</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "border-sky-200/80 bg-gradient-to-br from-sky-50/80 to-white dark:border-sky-900/40 dark:from-sky-950/20",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-sky-600 hover:bg-sky-600">FMF · допплер</Badge>
          <Badge variant="outline">Лекция {lecture.number}</Badge>
        </div>
        <CardTitle className="text-base">{lecture.title}</CardTitle>
        <CardDescription className="leading-relaxed">{lecture.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={moduleHref}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Открыть модуль
          </Link>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <Link href={courseHref}>ISUOG Basic Training</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
