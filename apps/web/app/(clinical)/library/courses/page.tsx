import { redirect } from "next/navigation";

export default function LegacyLibraryCoursesRedirect() {
  redirect("/tools/refs/courses");
}
