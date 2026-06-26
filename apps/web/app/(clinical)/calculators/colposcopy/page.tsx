import { redirect } from "next/navigation";

export default function LegacyGynRedirect() {
  redirect("/tools/calc/gyn/colposcopy");
}
