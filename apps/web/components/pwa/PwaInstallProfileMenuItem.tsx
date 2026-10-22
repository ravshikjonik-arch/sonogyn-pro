"use client";

import { Smartphone } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { openPwaInstall } from "@/lib/pwa/install-bus";

/** Пункт меню профиля в клинической шапке. */
export function PwaInstallProfileMenuItem() {
  const { installed, offerInstall } = usePwaInstall();

  if (installed || !offerInstall) return null;

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        openPwaInstall({ source: "menu" });
      }}
    >
      <Smartphone className="mr-2 h-4 w-4" />
      На экран «Домой»
    </DropdownMenuItem>
  );
}
