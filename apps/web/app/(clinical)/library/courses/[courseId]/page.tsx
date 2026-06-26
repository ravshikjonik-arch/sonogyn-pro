import { redirect } from "next/navigation";

type Props = { params: Promise<{ courseId: string }> };

export default async function LegacyCourseDetailRedirect({ params }: Props) {
  const { courseId } = await params;
  redirect(`/tools/refs/courses/${courseId}`);
}
