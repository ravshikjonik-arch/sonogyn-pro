import { redirect } from "next/navigation";

/** Legacy path — canonical IA v2: /tools/calc/rads/bi-rads */
export default function LegacyBiradsRedirect() {
  redirect("/tools/calc/rads/bi-rads");
}
