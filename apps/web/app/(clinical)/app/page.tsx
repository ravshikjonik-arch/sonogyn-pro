import { CommandCenter } from "@/components/spatial";

/** Open access: no static redirect cache from the old /app → /cases bridge. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AppHomePage() {
  return <CommandCenter />;
}
