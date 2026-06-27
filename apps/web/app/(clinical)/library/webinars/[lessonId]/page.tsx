import type { Metadata } from "next";

import { WebinarRoomClient } from "@/components/webinars/WebinarRoomClient";
import { createClient } from "@/utils/supabase/server";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("course_lessons").select("title").eq("id", lessonId).maybeSingle();
  return { title: lesson?.title ? `${lesson.title} · Вебинар` : "Вебинар" };
}

export default async function WebinarRoomPage({ params }: Props) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("course_id, lesson_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.lesson_type !== "webinar") {
    return (
      <div className="px-4 py-10 text-center text-sm">
        Вебинар не найден.{" "}
        <a href="/library/webinars" className="text-[var(--clinical-primary)] underline">
          К каталогу
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <WebinarRoomClient lessonId={lessonId} courseId={lesson.course_id as string} />
      </div>
    </div>
  );
}
