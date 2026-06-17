import { ColposcopyFlow } from "@/components/calculators/colposcopy/ColposcopyFlow";

export const metadata = {
  title: "Кольпоскопия · Swede Score · SonoGyn",
  description:
    "Протокол кольпоскопии по стандартному бланку, калькулятор Swede Score, схема шейки, шаблоны заключений, PDF и почта.",
};

export default function ColposcopyPage() {
  return <ColposcopyFlow />;
}
