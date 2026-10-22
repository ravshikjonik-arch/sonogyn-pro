"use client";

import { listBookEntriesForSeedNosology } from "@repo/book-nosology-registry";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { nosologyId: string };

export function NosologyBookModulesCard({ nosologyId }: Props) {
  const entries = useMemo(() => listBookEntriesForSeedNosology(nosologyId), [nosologyId]);
  if (entries.length === 0) return null;

  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--clinical-primary)]" />
          <CardTitle className="text-base">Учебные атласы (книги)</CardTitle>
        </div>
        <CardDescription>Главы и иллюстрации, привязанные к этой нозологии</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/tools/refs/book-nosology/${encodeURIComponent(e.id)}`}
            className="block rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm hover:bg-[var(--clinical-muted)]"
          >
            <span className="font-medium">{e.titleRu}</span>
            {e.imageCount > 0 ? (
              <span className="text-[var(--clinical-foreground-muted)]"> · {e.imageCount} сним.</span>
            ) : null}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
