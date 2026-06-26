import type { Redirect } from "next/dist/lib/load-custom-routes";

/** Legacy /calculators/* → canonical /tools/calc/* (P0.5 + P1). */
function legacyCalculatorRedirects(): Redirect[] {
  const obSlugs = [
    "fetal-weight",
    "bishop",
    "vbac",
    "pregnancy-medications",
    "cervical-length",
  ];
  const radsSlugs = ["o-rads", "bi-rads", "ln-rads"];
  const gynSlugs = [
    "endometrium",
    "pop-q",
    "colposcopy",
    "cin-risk",
    "cervical-intelligence",
    "elastography",
    "breast-risk",
    "cervical-cancer-risk",
    "cin-follow-up",
    "ovarian-cancer-risk",
  ];

  const out: Redirect[] = [
    { source: "/calculators", destination: "/tools/calc", permanent: false },
    { source: "/calculators/ob", destination: "/tools/calc/ob", permanent: false },
    { source: "/calculators/ti-rads", destination: "/tools/adjunct/ti-rads", permanent: false },
    { source: "/calculators/appointment", destination: "/tools/calc/ob", permanent: false },
  ];

  for (const slug of obSlugs) {
    out.push({
      source: `/calculators/${slug}`,
      destination: `/tools/calc/ob/${slug}`,
      permanent: false,
    });
  }
  for (const slug of radsSlugs) {
    out.push({
      source: `/calculators/${slug}`,
      destination: `/tools/calc/rads/${slug}`,
      permanent: false,
    });
  }
  for (const slug of gynSlugs) {
    out.push({
      source: `/calculators/${slug}`,
      destination: `/tools/calc/gyn/${slug}`,
      permanent: false,
    });
  }

  return out;
}

/**
 * IA v2 legacy → canonical redirects (modules-migration-map.csv).
 * Bridge pages at new_href serve legacy UI until full move.
 */
export const IA_V2_REDIRECTS: Redirect[] = [
  // P0
  { source: "/app", destination: "/cases", permanent: false },
  { source: "/community", destination: "/cases", permanent: false },
  { source: "/community/:path*", destination: "/cases/:path*", permanent: false },

  // P0.5 — AI
  { source: "/workspace", destination: "/ai/workspace", permanent: false },
  { source: "/workspace/:path*", destination: "/ai/workspace/:path*", permanent: false },
  { source: "/assistant", destination: "/ai/consultants", permanent: false },
  { source: "/assistant/:path*", destination: "/ai/consultants/:path*", permanent: false },

  // P0.5 — refs (library hub covered under P1 /library)
  { source: "/guidelines", destination: "/tools/refs/guidelines", permanent: false },
  { source: "/guidelines/:path*", destination: "/tools/refs/guidelines/:path*", permanent: false },
  { source: "/reference/norms", destination: "/tools/refs/consensus", permanent: false },
  { source: "/reference/norms/:path*", destination: "/tools/refs/consensus/:path*", permanent: false },
  { source: "/reference", destination: "/tools/refs/norms", permanent: false },
  { source: "/nosologies", destination: "/tools/refs/nosologies", permanent: false },
  { source: "/nosologies/:path*", destination: "/tools/refs/nosologies/:path*", permanent: false },

  // P0.5 — calculators (generated)
  ...legacyCalculatorRedirects(),

  // P1 — billing, library, mockups hub
  { source: "/paywall", destination: "/profile/pro", permanent: false },
  { source: "/library", destination: "/tools/refs", permanent: false },
  { source: "/library/:path*", destination: "/tools/refs/:path*", permanent: false },
  { source: "/mockups", destination: "/tools/mapping", permanent: false },
  { source: "/mockups/:path*", destination: "/tools/mapping/:path*", permanent: false },

  // P1 — anatomical mapping (mockup.*)
  { source: "/uterus-3d", destination: "/tools/mapping/uterus", permanent: false },
  { source: "/uterus-3d/:path*", destination: "/tools/mapping/uterus", permanent: false },
  { source: "/ovary-atlas", destination: "/tools/mapping/ovary", permanent: false },
  { source: "/ovary-atlas/:path*", destination: "/tools/mapping/ovary", permanent: false },
  { source: "/breast-3d", destination: "/tools/mapping/breast", permanent: false },
  { source: "/breast-3d/:path*", destination: "/tools/mapping/breast", permanent: false },
  {
    source: "/idea-deep-endometriosis",
    destination: "/tools/mapping/endometriosis",
    permanent: false,
  },
  {
    source: "/idea-deep-endometriosis/:path*",
    destination: "/tools/mapping/endometriosis",
    permanent: false,
  },

  // P1 — refs
  { source: "/evidence", destination: "/tools/refs/evidence", permanent: false },
  { source: "/evidence/:path*", destination: "/tools/refs/evidence/:path*", permanent: false },

  // P1 — reports
  { source: "/reports/adnex", destination: "/tools/calc/rads/adnex-report", permanent: false },

  // P2 — admin under /profile
  { source: "/patients", destination: "/profile/patients", permanent: false },
  { source: "/patients/:path*", destination: "/profile/patients/:path*", permanent: false },
  { source: "/dashboard", destination: "/profile/dashboard", permanent: false },
  { source: "/dashboard/:path*", destination: "/profile/dashboard/:path*", permanent: false },

  // Misc legacy alias
  { source: "/orads-calculator", destination: "/tools/calc/rads/o-rads", permanent: false },
];

/** Bridge via page components only (avoid next.config ↔ legacy redirect loops). */
export const IA_V2_BRIDGE_REDIRECTS: Redirect[] = [
  { source: "/tools/calc/rads/o-rads", destination: "/calculators/o-rads", permanent: false },
  { source: "/tools/calc/rads/bi-rads", destination: "/calculators/bi-rads", permanent: false },
  { source: "/tools/calc/rads/ln-rads", destination: "/calculators/ln-rads", permanent: false },
  { source: "/tools/adjunct/ti-rads", destination: "/calculators/ti-rads", permanent: false },
];
