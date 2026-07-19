"use client";

import Link from "next/link";
import { ListVideo } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CASE_PLAYLISTS, type CasePlaylist } from "@/lib/cases/playlists";
import { cn } from "@/lib/utils/cn";

type Props = {
  activeId: string | null;
  onSelect: (playlist: CasePlaylist | null) => void;
};

export function CasePlaylistsBar({ activeId, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ListVideo className="h-4 w-4 text-[var(--clinical-primary)]" />
        Плейлисты кейсов
        <Badge variant="outline" className="text-[10px]">
          Radiopaedia-style
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs transition",
            !activeId
              ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10 font-medium"
              : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
          )}
        >
          Все кейсы
        </button>
        {CASE_PLAYLISTS.map((playlist) => (
          <button
            key={playlist.id}
            type="button"
            onClick={() => onSelect(playlist)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition",
              activeId === playlist.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10 font-medium"
                : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
            )}
          >
            {playlist.titleRu}
          </button>
        ))}
      </div>
      {activeId && (() => {
        const p = CASE_PLAYLISTS.find((x) => x.id === activeId);
        if (!p) return null;
        return (
          <div className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-3 py-2 text-xs">
            <p className="text-[var(--clinical-foreground-muted)]">{p.description}</p>
            {p.educationLinks && p.educationLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.educationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-medium text-[var(--clinical-primary)] underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
