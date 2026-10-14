import { OpenAccessHomeClient } from "@/components/clinical/OpenAccessHomeClient";

/**
 * Client-only cabinet: custom-domain edge truncates any body ~16–20KB
 * (HTML and even `/_next/static` CSS). First document must be tiny and complete;
 * JS/CSS load from vercel.app via assetPrefix.
 */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

export default function OpenAccessHomePage() {
  return <OpenAccessHomeClient />;
}
