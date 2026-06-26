import { redirect } from "next/navigation";

/** Legacy path — canonical IA v2: /tools/calc/rads/ln-rads */
export default function LegacyLnRadsRedirect() {
  redirect("/tools/calc/rads/ln-rads");
}
