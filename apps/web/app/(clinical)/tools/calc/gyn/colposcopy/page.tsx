import { ColposcopyFlow } from "@/components/tools/calc/gyn/colposcopy/ColposcopyFlow";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/colposcopy");

export default function ColposcopyPage() {
  return <ColposcopyFlow />;
}
