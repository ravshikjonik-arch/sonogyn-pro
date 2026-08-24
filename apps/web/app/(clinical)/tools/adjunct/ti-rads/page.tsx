import { redirect } from "next/navigation";

/** Legacy adjunct URL → canonical RADS hub. */
export default function TiradsAdjunctRedirectPage() {
  redirect("/tools/calc/rads/ti-rads");
}
