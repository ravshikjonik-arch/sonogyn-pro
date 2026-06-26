import { redirect } from "next/navigation";

/** Старые закладки `/elastography` → canonical IA v2. */
export default function LegacyElastographyRedirect() {
  redirect("/tools/calc/gyn/elastography");
}
