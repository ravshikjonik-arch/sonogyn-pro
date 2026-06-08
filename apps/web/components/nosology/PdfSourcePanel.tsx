"use client";

import type { Nosology } from "@repo/nosology";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Заглушка PDF-первоисточника — готова к подключению react-pdf или iframe */
export function PdfSourcePanel({ nosology }: { nosology: Nosology }) {
  const pdfUrl = process.env.NEXT_PUBLIC_NOSOLOGY_PDF_URL;
  const keywords = nosology.pdfKeywords?.join(", ") ?? nosology.title;
  const page = nosology.pdfPageHint;

  return (
    <aside className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="h-4 w-4 text-[var(--clinical-primary)]" />
        Связь с PDF-книгой
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Поиск по ключевым словам: <strong>{keywords}</strong>
        {page ? ` · ориентир: стр. ${page}` : null}
      </p>

      {pdfUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--clinical-border)]">
          <iframe
            title="PDF первоисточник"
            src={`${pdfUrl}#page=${page ?? 1}`}
            className="h-64 w-full bg-white"
          />
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-[var(--clinical-muted)] p-3 text-xs text-[var(--clinical-foreground-muted)]">
          PDF-книга не подключена. Задайте <code className="text-[10px]">NEXT_PUBLIC_NOSOLOGY_PDF_URL</code> в
          `.env.local` или импортируйте файл в `public/books/`. Индексация страниц будет доступна в следующем
          обновлении.
        </p>
      )}

      <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" disabled={!pdfUrl}>
        Открыть в книге{page ? ` (стр. ${page})` : ""}
      </Button>
    </aside>
  );
}
