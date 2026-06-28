import { getOradsNosologyBySubtype, resolveOradsNosologyImageUri, type OradsNosologyAtlasEntry } from "@repo/orads-us";

import { getWebApiBase } from "../../api/chatBackend";
import type { UnilocularSubtype } from "./types";

export function resolveOradsNosologyPreview(
  subtype: UnilocularSubtype | undefined,
): { entry: OradsNosologyAtlasEntry; imageUri: string | null } | null {
  const entry = getOradsNosologyBySubtype(subtype);
  if (!entry) return null;

  const base = getWebApiBase();
  const imageUri = base ? resolveOradsNosologyImageUri(entry.imageSrc, base) : null;
  return { entry, imageUri };
}
