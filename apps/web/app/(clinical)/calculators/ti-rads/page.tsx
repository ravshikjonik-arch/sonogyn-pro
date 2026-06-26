import { redirect } from "next/navigation";

/** Legacy path — canonical IA v2: /tools/adjunct/ti-rads */
export default function LegacyTiradsRedirect() {
  redirect("/tools/adjunct/ti-rads");
}
