import { redirect } from "next/navigation";

/** Бывшие карточки OSS → рабочий помощник врача. */
export default function PlatformRepoSlugRedirectPage() {
  redirect("/ai/consultants");
}
