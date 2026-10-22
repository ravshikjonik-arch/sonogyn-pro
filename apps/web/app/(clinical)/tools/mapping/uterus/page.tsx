import { Uterus3DClientBody } from "@/app/(clinical)/uterus-3d/uterus-3d-client";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/mapping/uterus");

export default function UterusMappingPage() {
  return <Uterus3DClientBody />;
}
