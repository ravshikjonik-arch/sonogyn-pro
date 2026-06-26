import { redirect } from "next/navigation";

type Props = { params: Promise<{ courseId: string; lessonId: string }> };

export default async function LegacyLessonRedirect({ params }: Props) {
  const { courseId, lessonId } = await params;
  redirect(`/tools/refs/courses/${courseId}/lessons/${lessonId}`);
}
