import { BookOpen, GraduationCap, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFetalAnatomy22ViewsEducationalLink } from "@/lib/clinical-assistant/second-trimester-anatomy";
import { cn } from "@/lib/utils/cn";

type FetalAnatomyEducationalLinkPanelProps = {
  variant?: "inline" | "card";
  className?: string;
};

/** Баннер связи FMF II скрининг ↔ модуль 22 среза / 65 ВПР. */
export function FetalAnatomyEducationalLinkPanel({
  variant = "card",
  className,
}: FetalAnatomyEducationalLinkPanelProps) {
  const { lecture, moduleHref, courseHref } = getFetalAnatomy22ViewsEducationalLink();

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/50 p-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-fuchsia-950/20",
          className,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Stethoscope className="h-4 w-4 text-violet-700 dark:text-violet-300" />
              <p className="text-sm font-bold text-violet-950 dark:text-violet-100">22 среза · 65 ВПР</p>
              {lecture ? (
                <Badge variant="outline" className="border-violet-300 text-violet-800">
                  ISUOG · лекция {lecture.number}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-violet-950/90 dark:text-violet-100/90">
              {lecture?.subtitle ??
                "Систематический анатомический скрининг II триместра · Е.С. Емельяненко"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={moduleHref}>
                <BookOpen className="mr-2 h-4 w-4" />
                Открыть модуль
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
        "border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white dark:border-violet-900/40 dark:from-violet-950/20",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-violet-600 hover:bg-violet-600">FMF · II скрининг</Badge>
          {lecture ? <Badge variant="outline">Лекция {lecture.number}</Badge> : null}
        </div>
        <CardTitle className="text-base">{lecture?.title ?? "22 ультразвуковых среза"}</CardTitle>
        <CardDescription className="leading-relaxed">
          {lecture?.subtitle ?? "Протокол исключения 65 ВПР плода"}
        </CardDescription>
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
