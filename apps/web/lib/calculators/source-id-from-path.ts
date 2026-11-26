/** Maps calculator landing path → ключ в CALCULATOR_GUIDELINE_SOURCES */
export function calculatorSourceIdFromPath(path: string): string | null {
  const map: Record<string, string> = {
    "/tools/calc/ob/fetal-weight": "fetal-weight",
    "/tools/calc/ob/bishop": "bishop",
    "/tools/calc/ob/vbac": "vbac",
    "/tools/calc/ob/cervical-length": "cervical-length",
    "/tools/calc/gyn/breast-risk": "breast-risk",
    "/tools/calc/gyn/cervical-cancer-risk": "cervical-cancer-risk",
    "/tools/calc/gyn/ovarian-cancer-risk": "ovarian-cancer-risk",
    "/tools/calc/gyn/cin-follow-up": "cin-follow-up",
    "/tools/calc/gyn/cin-risk": "cin-risk",
    "/tools/calc/gyn/colposcopy": "colposcopy",
    "/tools/calc/gyn/cervical-intelligence": "cervical-intelligence",
    "/tools/calc/gyn/endometrium": "endometrium",
    "/tools/calc/gyn/pop-q": "pop-q",
    "/tools/calc/gyn/elastography": "elastography",
    "/tools/calc/rads/o-rads": "o-rads",
    "/tools/calc/rads/bi-rads": "bi-rads",
    "/tools/calc/rads/ti-rads": "ti-rads",
    "/tools/calc/rads/ln-rads": "ln-rads",
    "/tools/calc/rads/iota": "iota",
  };
  return map[path] ?? null;
}