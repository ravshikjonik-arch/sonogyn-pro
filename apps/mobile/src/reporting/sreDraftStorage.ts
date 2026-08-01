export const SRE_DRAFT_STORAGE_KEY = "sonogyn:sre-draft-v1";

export type SreDraftCache = {
  description: string;
  impression: string;
  recommendations: string;
  templateSlug: string;
  domain?: "adnex" | "thyroid" | "obstetric";
  persistedId?: string;
  locale?: "ru" | "en";
  savedAt: string;
};
