import { redirect } from "next/navigation";

/** Каталог курсов авторов скрыт с платформы. */
export default function RefsCoursesPage() {
  redirect("/tools/refs");
}
