import { CommandCenter } from "@/components/spatial";

/** /app is redirected to /home; keep a static fallback if the redirect is skipped. */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

export default function AppHomePage() {
  return <CommandCenter />;
}
