import { redirect } from "next/navigation";

/** P0: legacy command center → default home is Cases. Subroutes (/app/courses) unchanged. */
export default function AppHomeRedirectPage() {
  redirect("/cases");
}
