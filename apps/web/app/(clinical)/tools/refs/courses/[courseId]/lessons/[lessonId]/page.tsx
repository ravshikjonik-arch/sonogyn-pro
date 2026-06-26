import type { Metadata } from "next";

import { LessonViewClient } from "@/components/courses/LessonViewClient";
import { createClient } from "@/utils/supabase/server";

type PageProps = { params: Promise<{ courseId: string; lessonId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("course_lessons").select("title").eq("id", lessonId).maybeSingle();
  return { title: lesson?.title ? `${lesson.title} · Урок` : "Урок" };
}

export default async function RefsLessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <LessonViewClient courseId={courseId} lessonId={lessonId} />
      </div>
    </div>
  );
}
