"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchClinicalTools, type ClinicalTool } from "@/lib/clinical-tools";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClinicalToolSearchDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchClinicalTools(query, { limit: 14 }), [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const onPick = useCallback(
    (tool: ClinicalTool) => {
      onOpenChange(false);
      setQuery("");
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--clinical-border)] px-4 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Что искать?
          </DialogTitle>
          <DialogDescription>
            Калькуляторы, чат, помощник, КР — синонимы на русском (яичник, щж, пролапс…)
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Input
            autoFocus
            placeholder="Например: срок, ПДР, O-RADS, чат…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="max-h-[min(50vh,360px)] overflow-y-auto border-t border-[var(--clinical-border)]">
          {(query.trim() ? results : searchClinicalTools("", { limit: 8 })).map((tool) => (
            <li key={tool.id} className="border-b border-[var(--clinical-border)] last:border-0">
              {tool.webHref ? (
                <Link
                  href={tool.webHref}
                  className="block px-4 py-3 transition hover:bg-[var(--clinical-muted)]"
                  onClick={() => onPick(tool)}
                >
                  <p className="font-bold text-[var(--clinical-foreground)]">{tool.title}</p>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{tool.subtitle}</p>
                </Link>
              ) : (
                <div className="px-4 py-3 text-sm text-[var(--clinical-foreground-muted)]">
                  <p className="font-bold text-[var(--clinical-foreground)]">{tool.title}</p>
                  <p className="text-xs">{tool.subtitle} · откройте в мобильном приложении</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function ClinicalToolSearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button type="button" variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" />
        Поиск
        <kbd className="ml-2 hidden rounded border px-1.5 text-[10px] opacity-60 sm:inline">⌘K</kbd>
      </Button>
      <ClinicalToolSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
