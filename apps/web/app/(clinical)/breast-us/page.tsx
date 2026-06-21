import { redirect } from "next/navigation";

/** Черновик breast-us отключён — используйте BI-RADS калькулятор. */
export default function BreastUsLegacyRedirect() {
  redirect("/calculators/bi-rads");
}
