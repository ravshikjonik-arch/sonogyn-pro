import { redirect } from "next/navigation";

export default function LegacyLibraryHubRedirect() {
  redirect("/tools/refs");
}
