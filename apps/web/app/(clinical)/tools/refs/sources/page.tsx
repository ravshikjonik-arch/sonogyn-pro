import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Источники и авторские права",
  description:
    "Официальные международные стратификации, гайдлайны и клинические рекомендации. Книжные атласы в продукте не публикуются.",
  robots: { index: true, follow: true },
};

const OFFICIAL = [
  {
    title: "ACR O-RADS US",
    href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS",
    note: "Официальная система стратификации придатков",
  },
  {
    title: "ACR BI-RADS",
    href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/BI-RADS",
    note: "Молочная железа",
  },
  {
    title: "ACR TI-RADS",
    href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/TI-RADS",
    note: "Щитовидная железа",
  },
  {
    title: "FIGO",
    href: "https://www.figo.org/",
    note: "Международная федерация гинекологии и акушерства",
  },
  {
    title: "ISUOG Guidelines",
    href: "https://www.isuog.org/clinical-resources/guidelines.html",
    note: "Ультразвук в акушерстве и гинекологии",
  },
  {
    title: "IOTA",
    href: "https://www.iotagroup.org/",
    note: "Модели риска образований яичников",
  },
  {
    title: "КР и приказы МЗ РФ / ДЗМ",
    href: "/tools/refs/guidelines",
    note: "Клинические рекомендации в кабинете SonoGyn Pro",
  },
] as const;

export default function SourcesCopyrightPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[var(--clinical-foreground)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--clinical-primary-deep)]">
        SonoGyn Pro
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Источники и авторские права</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        В приложении доступны калькуляторы стратификации (O-RADS, BI-RADS, TI-RADS, FIGO и др.) и ссылки
        на <strong>официальные</strong> международные системы и клинические рекомендации. Учебные сканы
        книг, PDF журналов и атласы сторонних авторов <strong>не публикуются</strong> для пользователей.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Официальные ресурсы</h2>
        <ul className="space-y-2">
          {OFFICIAL.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-4 py-3"
            >
              <a
                className="font-semibold text-[var(--clinical-primary)] underline-offset-2 hover:underline"
                href={item.href}
                {...(item.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.title}
              </a>
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">Правообладателям</h2>
        <p>
          По вопросам удаления материалов:{" "}
          <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
            Sonogyn-pro@mail.ru
          </a>
          . Политика:{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            /privacy
          </Link>
          , условия:{" "}
          <Link href="/terms" className="underline underline-offset-2">
            /terms
          </Link>
          .
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/calc/rads/o-rads"
          className="rounded-xl bg-[var(--clinical-primary)] px-4 py-2 font-medium text-white"
        >
          O-RADS калькулятор
        </Link>
        <Link
          href="/tools/refs/guidelines"
          className="rounded-xl border border-[var(--clinical-border)] px-4 py-2"
        >
          КР и гайдлайны
        </Link>
        <Link href="/home" className="rounded-xl border border-[var(--clinical-border)] px-4 py-2">
          В кабинет
        </Link>
      </div>
    </main>
  );
}
