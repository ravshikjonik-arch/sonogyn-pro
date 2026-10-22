import Link from "next/link";

import { OFFLINE_QUICK_LINKS } from "@/lib/pwa/offline-precache-routes";

export const metadata = {
  title: "Нет подключения",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary,#94a3b8)]">
          SonoGyn Pro
        </p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary,#edeff3)]">Нет подключения</h1>
        <p className="text-sm text-[var(--text-secondary,#94a3b8)]">
          Чат, лента кейсов и AI требуют сеть. Доступны калькуляторы, сохранённая история и шаблоны
          заключений на устройстве.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {OFFLINE_QUICK_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center justify-center rounded-[var(--radius-control,8px)] border border-[var(--border-subtle,rgba(255,255,255,0.12))] bg-[var(--bg-secondary,#151820)] px-4 text-sm font-medium text-[var(--text-primary,#edeff3)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#7c6df5)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-[var(--text-secondary,#94a3b8)]">
        Когда сеть вернётся, обновите страницу или вернитесь в{" "}
        <Link href="/home" className="underline underline-offset-2">
          кабинет
        </Link>
        .
      </p>
    </main>
  );
}
