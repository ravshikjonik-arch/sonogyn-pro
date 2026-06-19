import { CourseEditorClient } from "@/components/author/CourseEditorClient";

type Params = { params: Promise<{ courseId: string }> };

export default async function AuthorCourseEditorPage({ params }: Params) {
  const { courseId } = await params;
  return <CourseEditorClient courseId={courseId} />;
}
