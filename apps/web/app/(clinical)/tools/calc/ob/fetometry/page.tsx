import { FetometryBookPanel } from "@/components/tools/calc/ob/FetometryBookPanel";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/ob/fetometry");

export default function FetometryBookPage() {
  return <FetometryBookPanel />;
}
