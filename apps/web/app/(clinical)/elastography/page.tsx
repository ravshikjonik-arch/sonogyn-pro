import { redirect } from "next/navigation";

/** Старые закладки `/elastography` → калькулятор внутри Calculators. */
export default function LegacyElastographyRedirect() {
  redirect("/calculators/elastography");
}
