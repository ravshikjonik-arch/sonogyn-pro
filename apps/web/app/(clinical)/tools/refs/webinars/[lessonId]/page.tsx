import { redirect } from "next/navigation";

/** Вебинары / курсы скрыты с платформы. */
export default function WebinarLessonPage() {
  redirect("/tools/refs");
}
