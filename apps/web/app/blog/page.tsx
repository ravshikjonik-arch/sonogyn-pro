import type { Metadata } from "next";
import Link from "next/link";

import { CLINICAL_CONTENT_DISCLAIMER } from "@/lib/seo/clinical-reviewer";
import { listBlogPosts } from "@/lib/seo/blog-posts";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Блог для врачей УЗИ и АГ",
  description:
    "Разборы гайдлайнов, маршруты калькуляторов и клинические заметки SonoGyn Pro. CDS для специалистов, не для пациентов.",
  path: "/blog",
  keywords: ["O-RADS", "IOTA", "эндометрий", "УЗИ", "акушерство", "гинекология"],
});

const KIND_LABEL = {
  guideline: "Гайдлайн",
  case: "Кейс",
  "how-to": "Как считать",
} as const;

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-foreground-muted)]">
          Контент · SEO
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--clinical-foreground)]">
          Блог SonoGyn Pro
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
          Короткие материалы для врачей УЗИ и акушеров-гинекологов: как пользоваться калькуляторами,
          чем отличаются рамки O-RADS и IOTA, как фиксировать M-эхо. Числовые пороги — в модулях и
          гайдлайнах, не «из головы» в статье.
        </p>
      </header>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 transition hover:border-[var(--clinical-primary)]/40 hover:bg-[var(--clinical-muted)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                {KIND_LABEL[post.kind]} · {post.updatedAt}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--clinical-foreground)]">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                {post.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {CLINICAL_CONTENT_DISCLAIMER}
      </p>
      <p className="text-sm">
        <Link href="/tools/calc" className="font-medium text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline">
          ← Каталог калькуляторов
        </Link>
      </p>
    </main>
  );
}
