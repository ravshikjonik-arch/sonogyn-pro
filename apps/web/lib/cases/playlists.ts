export type CasePlaylistFilter = {
  orads?: string;
  tags?: string;
  q?: string;
  lifecycle?: string;
};

export type CasePlaylist = {
  id: string;
  titleRu: string;
  description: string;
  topic: "obstetrics" | "gynecology" | "general";
  filters: CasePlaylistFilter;
  educationLinks?: { href: string; label: string }[];
};

/** Curated case playlists (Radiopaedia-style) — filter presets for community case library. */
export const CASE_PLAYLISTS: CasePlaylist[] = [
  {
    id: "orads-adnexal",
    titleRu: "O-RADS · аднексальные массы",
    description: "Кейсы с O-RADS 2–5: кисты, солидные компоненты, ascites.",
    topic: "gynecology",
    filters: { tags: "orads,adnex" },
    educationLinks: [
      { href: "/tools/refs/orads-guide", label: "O-RADS Guide" },
      { href: "/tools/calc/rads/o-rads", label: "Калькулятор O-RADS" },
    ],
  },
  {
    id: "obstetric-doppler",
    titleRu: "Акушерский допpler · FGR / IUGR",
    description: "Задержка роста, критический допpler ПА, oligo/polyhydramnios.",
    topic: "obstetrics",
    filters: { tags: "doppler,fgr,iugr" },
    educationLinks: [
      { href: "/tools/refs/exam-checklists", label: "Чек-лист III триместра" },
      { href: "/tools/refs/patient-information", label: "Листовка FGR" },
    ],
  },
  {
    id: "first-trimester",
    titleRu: "I триместр · скрининг",
    description: "NT, эктопия, CSSP, ранние аномалии.",
    topic: "obstetrics",
    filters: { tags: "first-trimester,screening,nt" },
    educationLinks: [
      { href: "/tools/refs/obstetric-atlas", label: "Атлас I триместра" },
      { href: "/ai/consultants/fmf?section=first", label: "FMF I скрининг" },
    ],
  },
  {
    id: "cervix-pathology",
    titleRu: "Шейка · цитология / colposcopy",
    description: "CIN, colposcopy, шейка матки при Б.",
    topic: "gynecology",
    filters: { tags: "cervix,cin,colposcopy" },
    educationLinks: [
      { href: "/tools/refs/cervix-pathology", label: "Справочник шейки" },
      { href: "/calculators/colposcopy", label: "Кольпоскопия" },
    ],
  },
  {
    id: "fetal-anatomy",
    titleRu: "II триместр · анатомия плода",
    description: "22 views, VSD, spina bifida, CDH — систематический скрининг.",
    topic: "obstetrics",
    filters: { tags: "anatomy,second-trimester,vpr" },
    educationLinks: [
      { href: "/tools/refs/fetal-anatomy-22-views", label: "22 среза · 65 ВПР" },
      { href: "/tools/refs/fetal-spine", label: "Атлас позвоночника" },
    ],
  },
  {
    id: "endometriosis",
    titleRu: "Эндометриоз · DE / IDEA",
    description: "Глубокий эндометриоз, DIE, bladder/endometrioma.",
    topic: "gynecology",
    filters: { tags: "endometriosis,die,idea" },
    educationLinks: [
      { href: "/idea-deep-endometriosis", label: "IDEA mapping" },
      { href: "/musa/adenomyosis", label: "MUSA · аденомиоз" },
    ],
  },
];

export function getCasePlaylist(id: string): CasePlaylist | undefined {
  return CASE_PLAYLISTS.find((p) => p.id === id);
}

export function playlistToFeedFilters(playlist: CasePlaylist) {
  return {
    q: playlist.filters.q ?? "",
    orads: playlist.filters.orads ?? "",
    tags: playlist.filters.tags ?? "",
    lifecycle: playlist.filters.lifecycle ?? null,
  };
}
