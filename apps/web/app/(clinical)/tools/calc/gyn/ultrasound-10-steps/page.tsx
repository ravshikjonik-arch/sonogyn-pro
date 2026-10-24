import { GynecologyUltrasound10StepsClient } from "@/components/gynecology-ultrasound-10-steps/GynecologyUltrasound10StepsClient";

export const metadata = {
  title: "Протокол УЗИ в гинекологии — 10 шагов | SonoGyn Pro",
  description:
    "Пошаговый протокол УЗИ малого таза: матка, эндометрий, яичники, жидкость, ГИЭ. Формулировки из приложенного руководства; не замена O-RADS/IOTA.",
};

export default function GynecologyUltrasound10StepsPage() {
  return <GynecologyUltrasound10StepsClient />;
}
