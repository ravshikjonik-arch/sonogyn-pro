"use client";

import dynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";

const CommandCenter = dynamic(
  () => import("@/components/spatial/CommandCenter").then((mod) => mod.CommandCenter),
  { ssr: false, loading: () => <CabinetBootScreen /> },
);

export function OpenAccessHomeClient() {
  return <CommandCenter />;
}
