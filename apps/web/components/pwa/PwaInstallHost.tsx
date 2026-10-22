"use client";

import { useEffect, useState } from "react";

import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { PwaInstallDialog } from "@/components/pwa/PwaInstallDialog";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";
import { onPwaInstallOpen } from "@/lib/pwa/install-bus";

type Props = {
  showAutoBanner?: boolean;
};

function PwaInstallHostInner({ showAutoBanner }: { showAutoBanner: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { installed, offerInstall } = usePwaInstall();

  useEffect(() => onPwaInstallOpen(() => setDialogOpen(true)), []);

  if (installed) return null;

  return (
    <>
      {showAutoBanner && offerInstall ? <PwaInstallBanner /> : null}
      <PwaInstallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export function PwaInstallHost({ showAutoBanner = false }: Props) {
  return <PwaInstallHostInner showAutoBanner={showAutoBanner} />;
}
