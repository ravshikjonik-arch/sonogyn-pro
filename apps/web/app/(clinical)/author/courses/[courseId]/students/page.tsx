import { StudentsPageClient } from "@/components/author/StudentsPageClient";

type Params = { params: Promise<{ courseId: string }> };

export default async function AuthorCourseStudentsPage({ params }: Params) {
  const { courseId } = await params;
  return <StudentsPageClient courseId={courseId} />;
}
