"use client";

import { useEffect, useState } from "react";

import { IotaCalculator } from "@/components/calculators/iota/IotaCalculator";
import { clearIotaBridgePayload, loadIotaBridgePayload } from "@/lib/reports/sre-iota-bridge";

export function IotaCalculatorPageClient() {
  const [initial, setInitial] = useState<{
    adnex?: Parameters<typeof IotaCalculator>[0]["initial"];
    oradsCategory?: number | null;
  }>({});

  useEffect(() => {
    const bridge = loadIotaBridgePayload();
    if (!bridge) return;
    setInitial({ adnex: bridge.adnex, oradsCategory: bridge.oradsCategory ?? null });
    clearIotaBridgePayload();
  }, []);

  return <IotaCalculator initial={initial.adnex} oradsCategory={initial.oradsCategory ?? null} />;
}
