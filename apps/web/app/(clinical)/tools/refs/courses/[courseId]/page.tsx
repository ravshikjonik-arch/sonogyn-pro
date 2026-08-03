import { redirect } from "next/navigation";

/** Страницы курсов скрыты с платформы. */
export default function RefsCourseDetailPage() {
  redirect("/tools/refs");
}
