"use client";

import {
  MessageCircle,
  BookMarked,
  Bookmark,
  BookOpen,
  ClipboardList,
  Brain,
  Calculator,
  Baby,
  FileText,
  HeartPulse,
  Library,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Shield,
  Sparkles,
  UserRound,
  HandHeart,
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
import { ClinicalBottomNav } from "@/components/clinical/ClinicalBottomNav";
import { MockupNavSection } from "@/components/clinical/MockupNavSection";
import { GlobalSearchTrigger } from "@/components/clinical/GlobalSearchDialog";
import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { ThemeToggle } from "@/components/clinical/theme-toggle";
import { ProBadge } from "@/components/pro/ProBadge";
import { ClinicalVoiceDock } from "@/components/voice/ClinicalVoiceDock";
import {
  VoiceReaderProvider,
  VoiceReaderRouteSync,
} from "@/components/voice/VoiceReaderProvider";
import {
  buildDoctorCabinetLabel,
  resolveDoctorFullName,
  type DoctorCabinetLabel,
} from "@/lib/auth/doctor-display";

const navGroups: { title: string; items: { href: string; label: string; icon: typeof MessageCircle }[] }[] = [
  {
    title: "Сообщество",
    items: [
      { href: "/feed", label: "Лента", icon: LayoutDashboard },
      { href: "/cases", label: "Чат врачей", icon: MessageCircle },
    ],
  },
  {
    title: "Акушерство",
    items: [
      { href: "/tools/obstetrics", label: "Хаб акушерства", icon: Baby },
      { href: "/ai/consultants/obstetrics", label: "Помощник акушера", icon: HandHeart },
      { href: "/ai/consultants/fmf", label: "FMF · скрининг", icon: Baby },
      { href: "/tools/calc/ob", label: "Кальк. беременности", icon: Calculator },
    ],
  },
  {
    title: "Гинекология",
    items: [
      { href: "/tools/gynecology", label: "Хаб гинекологии", icon: HeartPulse },
      { href: "/tools/calc/rads/o-rads", label: "O-RADS US", icon: ScanLine },
      { href: "/ai/consultants/gynecology", label: "Помощник гинеколога", icon: HandHeart },
      { href: "/tools/calc/gyn", label: "Кальк. гинекологии", icon: Calculator },
    ],
  },
  {
    title: "Калькуляторы",
    items: [
      { href: "/tools/calc", label: "Все калькуляторы", icon: Calculator },
      { href: "/tools/calc/rads/o-rads", label: "O-RADS US", icon: ScanLine },
      { href: "/tools/calc/rads/bi-rads", label: "BI-RADS", icon: ScanLine },
      { href: "/tools/calc/rads/ti-rads", label: "TI-RADS ЩЖ", icon: ScanLine },
      { href: "/tools/calc/appointment", label: "Приём · быстрые", icon: ClipboardList },
    ],
  },
  {
    title: "Помощник · EBM",
    items: [
      { href: "/ai/consultants", label: "Помощник врача", icon: HandHeart },
      { href: "/tools/refs/evidence-assistant", label: "Evidence AI", icon: Sparkles },
      { href: "/ai/workspace", label: "AI-зона · снимки", icon: Brain },
    ],
  },
  {
    title: "Справочник",
    items: [
      { href: "/tools/refs/guidelines", label: "КР и приказы", icon: FileText },
      { href: "/tools/refs/norms", label: "Клин. нормы", icon: BookOpen },
      { href: "/tools/refs/nosologies", label: "Нозологии", icon: ClipboardList },
    ],
  },
  {
    title: "Ещё",
    items: [
      { href: "/tools", label: "Все инструменты", icon: Library },
      { href: "/profile/patients", label: "Пациенты", icon: Users },
      { href: "/profile/dashboard", label: "Дашборд", icon: LayoutDashboard },
      { href: "/profile/pro", label: "PRO", icon: Sparkles },
      { href: "/profile", label: "Профиль", icon: UserRound },
    ],
  },
];

export function ClinicalShell({
  children,
  devProfile = null,
}: {
  children: React.ReactNode;
  devProfile?: {
    email: string;
    full_name: string;
    specialization: string;
    institution: string;
  } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();
  const { user } = useAuth();
  const isGuest = !user && !devProfile;
  const email = user?.email ?? devProfile?.email ?? "";
  const metaFullName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const displayName = metaFullName ?? devProfile?.full_name ?? (isGuest ? "Гость" : email);
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthor, setShowAuthor] = useState(false);
  const [cabinetLabel, setCabinetLabel] = useState<DoctorCabinetLabel>(() =>
    buildDoctorCabinetLabel(devProfile?.full_name ?? null),
  );

  const headerDisplayName =
    (cabinetLabel.doctorLine ?? cabinetLabel.abbrev ?? displayName) || email || (isGuest ? "Гость" : "Врач");
  const loginHref = `/login?redirectedFrom=${encodeURIComponent(pathname || "/app")}`;

  useEffect(() => {
    if (devProfile?.full_name) {
      setCabinetLabel(buildDoctorCabinetLabel(devProfile.full_name));
      return;
    }

    const uid = user?.id;
    if (!uid) {
      setCabinetLabel(buildDoctorCabinetLabel(null));
      return;
    }

    let cancelled = false;
    void Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", uid).maybeSingle(),
      supabase.from("users").select("full_name").eq("id", uid).maybeSingle(),
    ]).then(([{ data: profile }, { data: doctor }]) => {
      if (cancelled) return;
      if (profile?.role === "admin") setShowAdmin(true);
      if (profile?.role === "author" || profile?.role === "admin") setShowAuthor(true);
      const fullName = resolveDoctorFullName({
        profileFullName: doctor?.full_name ?? profile?.full_name,
        userMetadataFullName: metaFullName,
        emailFallback: user?.email,
      });
      setCabinetLabel(buildDoctorCabinetLabel(fullName));
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id, user?.email, metaFullName, devProfile?.full_name]);

  async function signOut() {
    setBusy(true);
    try {
      const { wipeWebClinicalLocalData } = await import("@/lib/security/wipe-clinical-local");
      wipeWebClinicalLocalData();
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
      await supabase.auth.signOut();
      router.refresh();
      router.push("/app");
    } finally {
      setBusy(false);
    }
  }

  const Sidebar = (
    <aside
      data-voice-ignore
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-200 ease-out",
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="sonogyn-brand-mark sonogyn-brand-pulse text-[10px]"
          title={cabinetLabel.doctorLine ?? "SonoGyn Pro"}
        >
          {cabinetLabel.doctorLine ? cabinetLabel.initials : "SG"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--clinical-foreground-muted)]">
            SonoGyn Pro
          </p>
          <p className="truncate text-sm font-semibold text-[var(--clinical-foreground)]">
            {cabinetLabel.cabinetTitle}
          </p>
          {cabinetLabel.doctorLine ? (
            <p className="truncate text-xs font-medium text-[var(--clinical-primary-deep)]">
              {cabinetLabel.doctorLine}
            </p>
          ) : null}
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
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const needsLogin =
                isGuest &&
                (item.href.startsWith("/profile") ||
                  item.href.startsWith("/patients") ||
                  item.href.startsWith("/paywall"));
              const href = needsLogin
                ? `/login?redirectedFrom=${encodeURIComponent(item.href)}`
                : item.href;
              const active =
                item.href === "/ai/workspace" || item.href.startsWith("/ai/workspace")
                  ? pathname.startsWith("/ai/workspace") || pathname.startsWith("/workspace")
                  : item.href === "/cases"
                    ? pathname === "/cases" ||
                      pathname.startsWith("/cases/") ||
                      pathname === "/community"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "sonogyn-nav-active text-[var(--clinical-primary-deep)]"
                      : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
                  )}
                  title={needsLogin ? "Чтобы открыть — войдите в аккаунт" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  {item.label}
                  {needsLogin ? (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                      вход
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
        <MockupNavSection onNavigate={() => setMobileOpen(false)} />

        {showAuthor ? (
          <Link
            href="/author"
            onClick={() => setMobileOpen(false)}
            data-testid="nav-author"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/author")
                ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
            )}
          >
            <BookOpen className="h-4 w-4 shrink-0 opacity-80" />
            Автор курсов
          </Link>
        ) : null}

        {showAdmin ? (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            data-testid="nav-admin"
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
    <VoiceReaderProvider>
      <VoiceReaderRouteSync pathname={pathname} />
      <div className="sonogyn-clinical-app flex min-h-screen sonogyn-mesh-bg">
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
        <header
          className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--clinical-border)] bg-[var(--clinical-header)]/95 px-4 backdrop-blur-md"
          data-voice-ignore
        >
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
          <GlobalSearchTrigger />
          {!isGuest ? <ProBadge className="hidden sm:inline-flex" /> : null}
          <ThemeToggle />
          {isGuest ? (
            <Button asChild size="sm" className="ml-auto" data-testid="guest-login-cta">
              <Link href={loginHref}>Войти</Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="ml-auto gap-2 font-normal" data-testid="user-menu-trigger">
                  <span className="hidden max-w-[180px] truncate text-left text-xs font-semibold sm:inline">
                    {headerDisplayName}
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
                <DropdownMenuItem onClick={() => void signOut()} disabled={busy} data-testid="logout-button">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        {isGuest ? (
          <div className="border-b border-amber-200/70 bg-amber-50/90 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            Открытый доступ: калькуляторы и справочники без регистрации.{" "}
            <Link href={loginHref} className="font-semibold underline underline-offset-2">
              Войдите
            </Link>
            , чтобы сохранить кейсы и пациентов. Скоро — Яндекс ID и SMS.
          </div>
        ) : null}
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sonogyn-enter lg:pb-0" data-voice-content>
          {children}
        </main>
        <ClinicalVoiceDock />
        <ClinicalBottomNav className="lg:hidden" />
      </div>
    </div>
    </VoiceReaderProvider>
  );
}
