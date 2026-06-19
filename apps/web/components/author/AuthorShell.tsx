"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/author", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/author/courses", label: "Курсы", icon: BookOpen },
  { href: "/author/profile", label: "Профиль", icon: UserCircle },
];

export function AuthorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--clinical-border)] pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
            SonoGyn Pro · Автор
          </p>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Онлайн-школа · курсы и лекции</p>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900/60">
          {links.map((link) => {
            const Icon = link.icon;
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white text-[var(--clinical-primary-deep)] shadow-sm dark:bg-slate-950"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
