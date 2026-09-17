import nextDynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";

/**
 * Do not SSR the cabinet: custom-domain edge truncates any body ~16–20KB
 * (HTML and even `/_next/static` CSS). First document must be tiny and complete;
 * JS/CSS load from vercel.app via assetPrefix.
 */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

const CommandCenter = nextDynamic(
  () => import("@/components/spatial/CommandCenter").then((mod) => mod.CommandCenter),
  { ssr: false, loading: () => <CabinetBootScreen /> },
);

export default function OpenAccessHomePage() {
  return <CommandCenter />;
}
