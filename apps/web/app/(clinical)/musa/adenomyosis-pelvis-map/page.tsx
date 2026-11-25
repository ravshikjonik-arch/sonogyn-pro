import { AdenomyosisPelvisMapClient } from "@/components/musa/AdenomyosisPelvisMapClient";

export const metadata = {
  title: "Карта таза · аденомиоз и ДИЭ | SonoGyn Pro",
  description:
    "Пошаговый маршрут УЗИ малого таза при аденомиозе (MUSA) и глубоком инфильтративном эндометриозе: анатомия, на что смотреть, фразы протокола.",
};

export default function AdenomyosisPelvisMapPage() {
  return (
    <main>
      <AdenomyosisPelvisMapClient />
    </main>
  );
}
