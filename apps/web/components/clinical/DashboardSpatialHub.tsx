"use client";

import { SpatialHubSection } from "@/components/spatial/SpatialHubSection";

export function DashboardSpatialHub() {
  return (
    <SpatialHubSection
      basePath="/profile/dashboard"
      title="Инструменты платформы"
      subtitle="Выберите раздел свайпом или стрелками — внутри откроется лента карточек без длинного списка."
    />
  );
}
