import { redirect } from "next/navigation";
export default function LegacyLibraryRedirect() {
  redirect("/tools/refs/cervix-pathology?tab=cytology");
}
