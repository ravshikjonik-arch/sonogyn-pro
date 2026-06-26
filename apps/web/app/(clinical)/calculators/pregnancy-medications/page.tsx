import { redirect } from "next/navigation";

export default function LegacyPregnancyMedsRedirect() {
  redirect("/tools/calc/ob/pregnancy-medications");
}
