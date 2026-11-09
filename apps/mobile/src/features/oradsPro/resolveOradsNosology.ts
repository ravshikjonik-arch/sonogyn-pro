import {
  getOradsNosologyBySubtype,
  getOradsNosologyPreviewImage,
  resolveOradsNosologyImageUri,
  type OradsNosologyAtlasEntry,
} from "@repo/orads-us";

import { getWebApiBase } from "../../api/chatBackend";
import type { UnilocularSubtype } from "./types";

export function resolveOradsNosologyPreview(
  subtype: UnilocularSubtype | undefined,
): { entry: OradsNosologyAtlasEntry; imageUri: string | null } | null {
  const entry = getOradsNosologyBySubtype(subtype);
  if (!entry) return null;

  const base = getWebApiBase();
  const previewImage = getOradsNosologyPreviewImage(entry);
  const imageUri = base && previewImage ? resolveOradsNosologyImageUri(previewImage, base) : null;
  return { entry, imageUri };
}
