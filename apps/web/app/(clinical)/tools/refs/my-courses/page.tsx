import { redirect } from "next/navigation";

/** «Мои курсы» скрыты с платформы. */
export default function RefsMyCoursesPage() {
  redirect("/tools/refs");
}
