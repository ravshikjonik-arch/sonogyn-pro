import { redirect } from "next/navigation";

/** Legacy path — canonical IA: /tools/calc/rads/ti-rads */
export default function LegacyTiradsRedirectPage() {
  redirect("/tools/calc/rads/ti-rads");
}
