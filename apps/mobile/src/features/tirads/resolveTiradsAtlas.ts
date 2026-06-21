import { pathologyImageUrl } from "@repo/tirads-acr";

import { getWebApiBase } from "../../../api/chatBackend";

export type TiradsAtlasPreview = {
  uri: string;
  fallbackUri: string;
  label: string;
};

/** URI эхограммы с web CDN (PNG → SVG fallback на клиенте). */
export function resolveTiradsAtlasPreview(imageFile: string, label: string): TiradsAtlasPreview | null {
  const base = getWebApiBase();
  if (!base) return null;
  return {
    uri: `${base}${pathologyImageUrl(imageFile, true)}`,
    fallbackUri: `${base}${pathologyImageUrl(imageFile, false)}`,
    label,
  };
}
