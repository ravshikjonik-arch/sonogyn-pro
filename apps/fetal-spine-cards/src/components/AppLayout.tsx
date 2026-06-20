import { Activity, BookOpen, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/cn";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-medical-border/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-medical-navy to-medical-navy-light text-sm font-black text-medical-teal shadow-md">
              SG
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-medical-navy">SonoGyn Pro</p>
              <p className="text-[11px] font-medium text-medical-muted">Позвоночник плода · УЗИ</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors sm:text-sm",
                isHome ? "bg-medical-navy text-white" : "text-medical-muted hover:bg-slate-100 hover:text-medical-navy",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Галерея
            </Link>
            <a
              href="#about"
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-medical-muted transition-colors hover:bg-slate-100 hover:text-medical-navy sm:inline-flex sm:text-sm"
            >
              <BookOpen className="h-4 w-4" />
              О модуле
            </a>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer id="about" className="mt-16 border-t border-medical-border bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-medical-navy">
                <Activity className="h-4 w-4 text-medical-teal" />
                Образовательный контент
              </p>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-medical-muted">
                15 карточек по ультразвуковой оценке позвоночника плода: норма, spina bifida, тератомы, сколиоз и др.
                Материал не заменяет клиническое суждение и протоколы вашей клиники. Интерпретация — специалистом.
              </p>
            </div>
            <p className="text-[11px] text-medical-muted">© SonoGyn Pro · offline-first SPA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
