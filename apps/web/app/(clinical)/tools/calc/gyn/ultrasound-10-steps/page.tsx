import { GynecologyUltrasound10StepsClient } from "@/components/gynecology-ultrasound-10-steps/GynecologyUltrasound10StepsClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Протокол УЗИ в гинекологии — 10 шагов",
  description: "Пошаговый протокол УЗИ малого таза: матка, эндометрий, яичники, жидкость, ГИЭ. Формулировки из приложенного руководства; не замена O-RADS/IOTA.",
  path: "/tools/calc/gyn/ultrasound-10-steps",
});

export default function GynecologyUltrasound10StepsPage() {
  return <GynecologyUltrasound10StepsClient />;
}
