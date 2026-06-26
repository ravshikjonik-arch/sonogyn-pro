import type { CalculatorDefinition } from "./registry";

const SLUG_TO_CANONICAL: Record<string, string> = {
  "o-rads": "/tools/calc/rads/o-rads",
  "bi-rads": "/tools/calc/rads/bi-rads",
  "ln-rads": "/tools/calc/rads/ln-rads",
  "orads-pro": "/tools/calc/rads/o-rads",
  "ti-rads": "/tools/adjunct/ti-rads",
  "ob-calc": "/tools/calc/ob",
  "fetal-weight": "/tools/calc/ob/fetal-weight",
  bishop: "/tools/calc/ob/bishop",
  vbac: "/tools/calc/ob/vbac",
  "pregnancy-medications": "/tools/calc/ob/pregnancy-medications",
  "cervical-length": "/tools/calc/ob/cervical-length",
  endometrium: "/tools/calc/gyn/endometrium",
  "pop-q": "/tools/calc/gyn/pop-q",
  colposcopy: "/tools/calc/gyn/colposcopy",
  "cin-risk": "/tools/calc/gyn/cin-risk",
  "cervical-intelligence": "/tools/calc/gyn/cervical-intelligence",
  elastography: "/tools/calc/gyn/elastography",
  "breast-risk": "/tools/calc/gyn/breast-risk",
  "cervical-cancer-risk": "/tools/calc/gyn/cervical-cancer-risk",
  "cin-follow-up": "/tools/calc/gyn/cin-follow-up",
  "ovarian-cancer-risk": "/tools/calc/gyn/ovarian-cancer-risk",
  figo: "/tools/mapping/uterus",
  fmf: "/ai/consultants/fmf",
};

function normalizeLegacyHref(href: string): string {
  if (href.startsWith("/assistant")) return href.replace("/assistant", "/ai/consultants");
  if (href.startsWith("/calculators/")) {
    const slug = href.slice("/calculators/".length).split("?")[0]!;
    return SLUG_TO_CANONICAL[slug] ?? href.replace("/calculators", "/tools/calc");
  }
  return href;
}

export function resolveCalculatorHref(definition: CalculatorDefinition): string {
  if (definition.externalHref) return normalizeLegacyHref(definition.externalHref);
  return SLUG_TO_CANONICAL[definition.slug] ?? `/tools/calc/${definition.slug}`;
}
