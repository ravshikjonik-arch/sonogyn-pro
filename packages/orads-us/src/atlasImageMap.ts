/** Maps wizard `imageRef` → adnex-education topic for echogram lookup. */
export const ORADS_ATLAS_TOPIC_BY_REF: Record<string, string> = {
  "atlas/localization": "orads",
  "atlas/ovarian": "orads",
  "atlas/extraovarian": "hydrosalpinx",
  "atlas/extraovarian/paraovarian": "paraovarian",
  "atlas/extraovarian/hydrosalpinx": "hydrosalpinx",
  "atlas/extraovarian/peritoneal_inclusion": "peritoneal",
  "atlas/physiologic": "follicle",
  "atlas/simple_cyst": "simple_cyst",
  "atlas/solid_dominant": "shadow",
  "atlas/classic_benign": "dermoid",
  "atlas/papillary_4plus": "papillary",
};

/** Fallback adnex page id when topic search misses. */
export const ORADS_ATLAS_PAGE_FALLBACK: Record<string, string> = {
  "atlas/localization": "ozerskaya-p03",
  "atlas/simple_cyst": "ozerskaya-p02",
  "atlas/papillary_4plus": "ozerskaya-p07",
};
