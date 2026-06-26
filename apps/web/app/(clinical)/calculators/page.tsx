import { redirect } from "next/navigation";

export default function LegacyCalculatorsHubRedirect() {
  redirect("/tools/calc");
}
