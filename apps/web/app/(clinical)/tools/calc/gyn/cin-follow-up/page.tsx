import { CinFollowUpCalculator } from "@/components/calculators/gynecologic/CinFollowUpCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/gyn/cin-follow-up");

export default function CinFollowUpPage() {
  return <CinFollowUpCalculator />;
}
