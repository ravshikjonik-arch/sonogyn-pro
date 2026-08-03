import { redirect } from "next/navigation";

/** Вебинары / курсы скрыты с платформы. */
export default function WebinarsPage() {
  redirect("/tools/refs");
}
