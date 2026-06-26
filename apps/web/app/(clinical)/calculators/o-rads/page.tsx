import { redirect } from "next/navigation";

/** Legacy path — canonical IA v2: /tools/calc/rads/o-rads */
export default function LegacyOradsRedirect() {
  redirect("/tools/calc/rads/o-rads");
}
