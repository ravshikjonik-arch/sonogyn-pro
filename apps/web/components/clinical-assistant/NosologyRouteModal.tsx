"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { assistantCardHref, type ObgynNosologyCard } from "@/lib/clinical-assistant";
import { NosologyRouteView } from "@/components/clinical-assistant/NosologyRouteView";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  card: ObgynNosologyCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPatientId?: string;
};

export function NosologyRouteModal({ card, open, onOpenChange, initialPatientId }: Props) {
  const backHref = card ? `/assistant/${card.mode}` : "/assistant";

  return (
    <Dialog open={open && !!card} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[92vh] grid-rows-[auto_1fr] gap-0 p-0 sm:max-w-4xl">
        {card ? (
          <>
            <DialogHeader className="shrink-0 border-b border-[var(--clinical-border)] px-5 py-3 pr-14">
              <DialogTitle className="text-base sm:text-lg">
                {card.code} · {card.title}
              </DialogTitle>
              <Button variant="link" size="sm" className="h-auto justify-start p-0 text-xs" asChild>
                <Link href={assistantCardHref(card.mode, card.code)} onClick={() => onOpenChange(false)}>
                  Открыть маршрут на весь экран →
                </Link>
              </Button>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto">
              <NosologyRouteView
                card={card}
                initialPatientId={initialPatientId}
                backHref={backHref}
                compact
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
