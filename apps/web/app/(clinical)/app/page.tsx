import nextDynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";

/** /app is redirected to /home; keep a static fallback if the redirect is skipped. */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

const CommandCenter = nextDynamic(
  () => import("@/components/spatial/CommandCenter").then((mod) => mod.CommandCenter),
  { ssr: false, loading: () => <CabinetBootScreen /> },
);

export default function AppHomePage() {
  return <CommandCenter />;
}
