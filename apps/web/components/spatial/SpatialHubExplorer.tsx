"use client";

import {
  Activity,
  Baby,
  BookOpen,
  Brain,
  ChevronRight,
  HeartPulse,
  ScanLine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SpatialCard } from "@/components/spatial/SpatialCard";
import { SpatialDeck } from "@/components/spatial/SpatialDeck";
import { SpatialModal } from "@/components/spatial/SpatialModal";
import { Button } from "@/components/ui/button";
import {
  getToolsForDeck,
  parseSpatialHubDeck,
  SPATIAL_HUB_DECKS,
  type SpatialHubDeckId,
} from "@/lib/spatial/hub-decks";

const DECK_ICONS: Record<SpatialHubDeckId, typeof ScanLine> = {
  rads: ScanLine,
  obstetrics: Baby,
  gynecology: HeartPulse,
  community: Users,
  assistant: Brain,
  reference: BookOpen,
};

function HubDeckCard({
  deckId,
  title,
  description,
  onOpen,
}: {
  deckId: SpatialHubDeckId;
  title: string;
  description: string;
  onOpen: () => void;
}) {
  const Icon = DECK_ICONS[deckId] ?? Activity;

  return (
    <SpatialCard depth={2} interactive className="h-full p-5">
      <button
        type="button"
        onClick={onOpen}
        className="sg-focus-ring flex h-full w-full flex-col text-left"
        aria-label={`Открыть раздел ${title}`}
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--sg-radius-md)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-accent-teal)]">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <span className="text-lg font-black tracking-tight text-[var(--clinical-foreground)]">{title}</span>
        <span className="mt-2 flex-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {description}
        </span>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--clinical-primary-deep)]">
          Листайте или нажмите
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </button>
    </SpatialCard>
  );
}

function ToolStrip({ deckId }: { deckId: SpatialHubDeckId }) {
  const tools = useMemo(() => getToolsForDeck(deckId).filter((t) => t.webHref), [deckId]);

  return (
    <SpatialDeck
      ariaLabel="Инструменты раздела"
      items={tools.map((tool) => ({
        id: tool.id,
        node: (
          <Link href={tool.webHref!} className="block h-full">
            <SpatialCard depth={1} interactive className="flex h-full min-h-[140px] flex-col p-4">
              <p className="text-sm font-black text-[var(--clinical-foreground)]">{tool.title}</p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                {tool.subtitle}
              </p>
              <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--clinical-accent-teal)]">
                Открыть
              </span>
            </SpatialCard>
          </Link>
        ),
      }))}
    />
  );
}

type SpatialHubExplorerProps = {
  basePath?: "/home" | "/profile/dashboard";
};

export function SpatialHubExplorer({ basePath = "/home" }: SpatialHubExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hubFromUrl = parseSpatialHubDeck(searchParams.get("hub"));
  const [openDeck, setOpenDeck] = useState<SpatialHubDeckId | null>(hubFromUrl);

  useEffect(() => {
    setOpenDeck(hubFromUrl);
  }, [hubFromUrl]);

  const syncUrl = useCallback(
    (deckId: SpatialHubDeckId | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (deckId) params.set("hub", deckId);
      else params.delete("hub");
      const q = params.toString();
      router.replace(q ? `${basePath}?${q}` : basePath, { scroll: false });
    },
    [basePath, router, searchParams],
  );

  const open = (deckId: SpatialHubDeckId) => {
    setOpenDeck(deckId);
    syncUrl(deckId);
  };

  const close = () => {
    setOpenDeck(null);
    syncUrl(null);
  };

  const activeDeck = SPATIAL_HUB_DECKS.find((d) => d.id === openDeck);

  return (
    <section aria-label="Пространственная навигация по инструментам" className="space-y-3">
      <SpatialDeck
        ariaLabel="Главные разделы платформы"
        activeId={openDeck ?? undefined}
        items={SPATIAL_HUB_DECKS.map((deck) => ({
          id: deck.id,
          node: (
            <HubDeckCard
              deckId={deck.id}
              title={deck.title}
              description={deck.description}
              onOpen={() => open(deck.id)}
            />
          ),
        }))}
        onActiveChange={(id) => {
          /* scroll focus only — sheet opens on click */
          void id;
        }}
      />

      <SpatialModal
        open={Boolean(activeDeck)}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={activeDeck?.title ?? "Раздел"}
        description={activeDeck?.description}
        className="max-w-3xl"
      >
        {openDeck ? <ToolStrip deckId={openDeck} /> : null}
        <div className="mt-4 flex justify-end border-t border-[var(--clinical-border)] pt-4">
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Закрыть
          </Button>
        </div>
      </SpatialModal>
    </section>
  );
}
