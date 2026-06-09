import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="sonogyn-mesh-bg flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="sonogyn-glass-card max-w-md rounded-3xl p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Страница не найдена</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Такого адреса нет. Если вы ставили PWA — откройте{" "}
          <strong className="font-semibold">/landing</strong> или очистите данные сайта в браузере.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/landing">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Войти</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
