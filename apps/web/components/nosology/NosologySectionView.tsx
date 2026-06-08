import Link from "next/link";
import type { ReactNode } from "react";

import type { NosologyBlock } from "@repo/nosology";

function linkifyClinicalText(text: string): ReactNode[] {
  const parts = text.split(/(\/(?:reference|assistant|nosologies)[^\s)\],]+)/g);
  return parts.map((part, i) => {
    if (!part.startsWith("/reference/") && !part.startsWith("/assistant/") && !part.startsWith("/nosologies/")) {
      return part;
    }
    const label = part.includes("/norms")
      ? "Таблица норм Медведева →"
      : part.includes("/assistant/fmf")
        ? "FMF-ассистент →"
        : part.includes("/nosologies")
          ? "Нозология →"
          : "Клинический справочник →";
    return (
      <Link key={`${part}-${i}`} href={part} className="font-semibold text-[var(--clinical-primary)] underline">
        {label}
      </Link>
    );
  });
}

export function NosologySectionView({ block, emptyLabel }: { block: NosologyBlock; emptyLabel?: string }) {
  const hasContent =
    block.intro ||
    (block.bullets && block.bullets.length > 0) ||
    (block.checklist && block.checklist.length > 0) ||
    (block.highlights && block.highlights.length > 0) ||
    block.table;

  if (!hasContent) {
    return <p className="text-sm text-[var(--clinical-foreground-muted)]">{emptyLabel ?? "Нет данных."}</p>;
  }

  return (
    <div className="space-y-4">
      {block.intro ? <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{block.intro}</p> : null}

      {block.highlights?.map((h) => (
        <div
          key={h.title}
          className="rounded-xl border border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/40 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-primary-deep)]">{h.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{linkifyClinicalText(h.body)}</p>
        </div>
      ))}

      {block.checklist && block.checklist.length > 0 ? (
        <ul className="space-y-2">
          {block.checklist.map((item) => (
            <li key={item} className="flex gap-2 text-sm">
              <span className="mt-0.5 text-[var(--clinical-primary)]" aria-hidden>
                ✓
              </span>
              <span>{linkifyClinicalText(item)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {block.bullets && block.bullets.length > 0 ? (
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {block.bullets.map((b) => (
            <li key={b}>{linkifyClinicalText(b)}</li>
          ))}
        </ul>
      ) : null}

      {block.table ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--clinical-border)]">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead className="bg-[var(--clinical-muted)]">
              <tr>
                {block.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-[var(--clinical-border)]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
