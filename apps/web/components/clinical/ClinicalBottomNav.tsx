"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { CLINICAL_PRIMARY_TABS, resolveClinicalPrimaryTab } from "@/lib/nav/clinical-primary-nav";

type Props = {
  className?: string;
};

export function ClinicalBottomNav({ className }: Props) {
  const pathname = usePathname();
  const activeId = resolveClinicalPrimaryTab(pathname);

  return (
    <nav
      aria-label="Основная навигация"
      data-testid="clinical-bottom-nav"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--clinical-border)] bg-[var(--clinical-header)]/95 backdrop-blur-md",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1 sm:max-w-2xl">
        {CLINICAL_PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeId === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-testid={`nav-tab-${tab.id}`}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors sm:text-xs",
                active
                  ? "text-[var(--clinical-primary-deep)]"
                  : "text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-foreground)]",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "opacity-100")} aria-hidden />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
