import { CommandCenter } from "@/components/spatial";

/** Canonical open-access cabinet (avoids stale /app → /cases edge redirect). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function OpenAccessHomePage() {
  return <CommandCenter />;
}
