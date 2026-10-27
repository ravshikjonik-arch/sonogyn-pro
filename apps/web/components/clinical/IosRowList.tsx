import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type IosRow = {
  href: string;
  title: string;
  detail?: string;
  badge?: string;
};

export function IosRowList({ rows }: { rows: IosRow[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      {rows.map((row, index) => (
        <li key={`${row.href}-${index}`} className={index > 0 ? "border-t border-[var(--clinical-border)]" : undefined}>
          <Link href={row.href} className="flex items-center gap-3 px-4 py-3 active:bg-[var(--clinical-muted)]">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--clinical-foreground)]">{row.title}</span>
              {row.detail ? (
                <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">{row.detail}</span>
              ) : null}
            </span>
            {row.badge ? (
              <span className="shrink-0 rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--clinical-foreground)]">
                {row.badge}
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
