import { redirect } from "next/navigation";

export default function LegacyAssistantHubRedirect() {
  redirect("/ai/consultants");
}
