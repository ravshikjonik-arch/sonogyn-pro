import { redirect } from "next/navigation";

/** Бывшая витрина OSS → рабочий помощник врача. */
export default function PlatformReposRedirectPage() {
  redirect("/ai/consultants");
}
