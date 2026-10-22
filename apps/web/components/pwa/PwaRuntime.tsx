"use client";

import { PwaInstallHost } from "@/components/pwa/PwaInstallHost";
import { PwaUpdateBanner } from "@/components/pwa/PwaUpdateBanner";

/** PWA UI: установка (в dev — только диалог из меню); обновление SW — production. */
export function PwaRuntime() {
  const production = process.env.NODE_ENV === "production";
  return (
    <>
      <PwaInstallHost showAutoBanner={production} />
      {production ? <PwaUpdateBanner /> : null}
    </>
  );
}
