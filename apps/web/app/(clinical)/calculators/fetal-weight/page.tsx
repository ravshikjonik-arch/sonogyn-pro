import { redirect } from "next/navigation";

export default function LegacyFetalWeightRedirect() {
  redirect("/tools/calc/ob/fetal-weight");
}
