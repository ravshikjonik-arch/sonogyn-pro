"use client";

import {
  Activity,
  Bookmark,
  BookOpen,
  ClipboardList,
  Brain,
  Calculator,
  HeartPulse,
  Library,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Shield,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth, useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { ThemeToggle } from "@/components/clinical/theme-toggle";

const nav = [
  { href: "/app", label: "Command Center", icon: LayoutDashboard },
  { href: "/dashboard", label: "Clinical Dashboard", icon: HeartPulse },
  { href: "/patients", label: "Пациенты", icon: Users },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/cases", label: "Cases & Discussion", icon: Activity },
  { href: "/nosologies", label: "Нозологии", icon: ClipboardList },
  { href: "/reference", label: "Клин. нормы", icon: BookOpen },
  { href: "/library", label: "Библиотека", icon: Library },
  { href: "/uterus-3d", label: "Срез матки", icon: Stethoscope },
  { href: "/idea-deep-endometriosis", label: "IDEA — глубокий эндометриоз", icon: ScanLine },
  { href: "/workspace", label: "AI Workspace", icon: Brain },
  { href: "/paywall", label: "Upgrade", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function ClinicalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();
  const { user } = useAuth();
  const email = user?.email ?? "";
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!cancelled && profile?.role === "admin") setShowAdmin(true);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
      await supabase.auth.signOut();
      router.refresh();
      router.push("/landing");
    } finally {
      setBusy(false);
    }
  }

  const Sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-200 ease-out",
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--clinical-primary)] text-xs font-black text-white">
          MU
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--clinical-foreground-muted)]">
            IntelliSpace-style shell
          </p>
          <p className="truncate text-sm font-semibold text-[var(--clinical-foreground)]">
            Ultrasound Clinical Suite
          </p>
        </div>
        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/workspace"
              ? pathname.startsWith("/workspace")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                  : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
        {showAdmin ? (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
            )}
          >
            <Shield className="h-4 w-4 shrink-0 opacity-80" />
            Admin
          </Link>
        ) : null}
      </nav>
      <div className="space-y-3 border-t border-[var(--clinical-border)] p-4">
        <TelegramChannelLink compact />
        <div className="rounded-xl bg-[var(--clinical-muted)] px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            PHI Notice
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            For demonstrations only — integrate BAAs, audit trails, and data residency before
            production clinical use.
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[var(--clinical-canvas)]">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
        aria-hidden
        onClick={() => setMobileOpen(false)}
      />
      {Sidebar}
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--clinical-border)] bg-[var(--clinical-header)]/95 px-4 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden flex-1 items-center gap-2 md:flex">
            <Bookmark className="h-4 w-4 text-[var(--clinical-foreground-muted)]" />
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
              Federated learning opt-out · Audit stream enabled (stub)
            </span>
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="ml-auto gap-2 font-normal">
                <span className="hidden max-w-[180px] truncate text-left text-xs font-semibold sm:inline">
                  {email || "Authenticated clinician"}
                </span>
                <UserRound className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile & credentials</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void signOut()} disabled={busy}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
