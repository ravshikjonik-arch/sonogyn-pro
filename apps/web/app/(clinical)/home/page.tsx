import { CommandCenter } from "@/components/spatial";

/**
 * Static HTML document (not a chunked SSR stream).
 * Custom-domain Vercel edge was truncating streamed /home ~16–17KB; static
 * files are served from every region with a complete Content-Length.
 */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

export default function OpenAccessHomePage() {
  return <CommandCenter />;
}
