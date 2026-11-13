import { permanentRedirect } from "next/navigation";

/** Legacy URL — канон маркетинга на `/`. */
export default function LandingRedirectPage() {
  permanentRedirect("/");
}
