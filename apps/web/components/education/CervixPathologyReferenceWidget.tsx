"use client";

import {
  BookOpen,
  GraduationCap,
  Headphones,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { CriteriaPanel } from "@/components/education/CriteriaPanel";
import { SpeakButton } from "@/components/voice/SpeakButton";
import { useVoicePageText } from "@/components/voice/VoiceReaderProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { renderSimpleMarkdown, studentGuideParagraphs } from "@/lib/education/simple-markdown";
import { cn } from "@/lib/utils/cn";
import {
  getCervixChapter,
  getCervixChapters,
  getDefaultCervixChapterId,
  type CervixChapterId,
} from "@repo/cervix-pathology-reference";

type ViewMode = "student" | "doctor";

type Props = {
  initialChapterId?: CervixChapterId;
  className?: string;
};

export function CervixPathologyReferenceWidget({ initialChapterId, className }: Props) {
  const chapters = useMemo(() => getCervixChapters(), []);
  const [chapterId, setChapterId] = useState<CervixChapterId>(initialChapterId ?? getDefaultCervixChapterId());
  const [viewMode, setViewMode] = useState<ViewMode>("student");

  const chapter = getCervixChapter(chapterId) ?? chapters[0]!;
  const studentParagraphs = useMemo(() => studentGuideParagraphs(chapter.studentGuide), [chapter.studentGuide]);
  const doctorHtml = useMemo(() => renderSimpleMarkdown(chapter.doctorQuickref), [chapter.doctorQuickref]);

  useVoicePageText(viewMode === "student" ? chapter.studentGuide : null);

  useEffect(() => {
    if (initialChapterId) setChapterId(initialChapterId);
  }, [initialChapterId]);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[220px_1fr]", className)}>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" aria-hidden />
              Главы
            </CardTitle>
            <CardDescription>7 разделов справочника</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {chapters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setChapterId(item.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  item.id === chapterId
                    ? "bg-[var(--clinical-primary-muted)] font-semibold text-[var(--clinical-primary-deep)]"
                    : "hover:bg-[var(--clinical-muted)]",
                )}
              >
                <span className="text-xs text-[var(--clinical-foreground-muted)]">{item.number}.</span> {item.shortTitle}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="outline">Глава {chapter.number}</Badge>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{chapter.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <ModeToggle
              active={viewMode === "student"}
              onClick={() => setViewMode("student")}
              icon={<GraduationCap className="h-4 w-4" />}
              label="Для студента"
            />
            <ModeToggle
              active={viewMode === "doctor"}
              onClick={() => setViewMode("doctor")}
              icon={<Stethoscope className="h-4 w-4" />}
              label="Для врача"
            />
          </div>
        </div>

        {viewMode === "student" ? (
          <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]" data-voice-content>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Headphones className="h-4 w-4" aria-hidden />
                Текст для озвучивания
              </CardTitle>
              <SpeakButton text={chapter.studentGuide} label={chapter.shortTitle} />
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              {studentParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]" data-voice-ignore>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Квик-референс</CardTitle>
              <CardDescription>Таблицы и сжатые формулировки — для визуального чтения, не для TTS.</CardDescription>
            </CardHeader>
            <CardContent
              className="prose-cervix space-y-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)] [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-amber-200 [&_blockquote]:bg-amber-50/80 [&_blockquote]:p-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_li]:ml-4 [&_ol]:list-decimal [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--clinical-border)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--clinical-border)] [&_th]:bg-[var(--clinical-muted)] [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: doctorHtml }}
            />
          </Card>
        )}

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
            Структурированные данные
          </h3>
          <CriteriaPanel data={chapter.criteria} />
        </section>
      </div>
    </div>
  );
}

function ModeToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
