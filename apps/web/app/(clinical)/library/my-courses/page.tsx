import { redirect } from "next/navigation";

export default function LegacyMyCoursesRedirect() {
  redirect("/tools/refs/my-courses");
}
