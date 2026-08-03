import { redirect } from "next/navigation";

/** Уроки курсов скрыты с платформы. */
export default function RefsLessonPage() {
  redirect("/tools/refs");
}
