import { ExternalLink, GraduationCap, PlayCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIsuogEarlyLectureLink } from "@/lib/clinical-assistant/early-pregnancy";
import { cn } from "@/lib/utils/cn";

type BasicCourseLinkPanelProps = {
  variant?: "inline" | "card";
  className?: string;
};

export function BasicCourseLinkPanel({ variant = "card", className }: BasicCourseLinkPanelProps) {
  const { lecture, courseHref } = getIsuogEarlyLectureLink();
  if (!lecture) return null;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-orange-50/50 p-4 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-orange-950/20",
          className,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <GraduationCap className="h-4 w-4 text-rose-700 dark:text-rose-300" />
              <p className="text-sm font-bold text-rose-950 dark:text-rose-100">ISUOG Basic Training</p>
              <Badge variant="outline" className="border-rose-300 text-rose-800">
                Лекция {lecture.number}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-rose-950/90 dark:text-rose-100/90">{lecture.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={courseHref}>Курс в приложении</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href={lecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Яндекс.Диск
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white dark:border-rose-900/40 dark:from-rose-950/20", className)}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-rose-600 hover:bg-rose-600">ISUOG</Badge>
          <Badge variant="outline">Лекция {lecture.number}</Badge>
        </div>
        <CardTitle className="text-base">{lecture.title}</CardTitle>
        <CardDescription className="leading-relaxed">{lecture.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={courseHref}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Открыть в библиотеке
          </Link>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a href={lecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Презентация PDF
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
