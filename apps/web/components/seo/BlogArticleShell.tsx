import Link from "next/link";

import { ContentErrorReportLink } from "@/components/feedback/ContentErrorReportLink";
import {
  CLINICAL_CONTENT_DISCLAIMER,
  CLINICAL_CONTENT_REVIEW_STATUS_RU,
} from "@/lib/seo/clinical-reviewer";
import type { BlogPost } from "@/lib/seo/blog-posts";
import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";


type Props = {
  post: BlogPost;
};

const KIND_LABEL: Record<BlogPost["kind"], string> = {
  guideline: "Разбор гайдлайна",
  case: "Клинический кейс",
  "how-to": "Как считать",
};

export function BlogArticleShell({ post }: Props) {
  const html = renderSimpleMarkdown(post.bodyMarkdown);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "SonoGyn Pro",
    },
    description: post.description,
  };

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-foreground-muted)]">
          <Link href="/blog" className="hover:text-[var(--clinical-primary-deep)]">
            Блог
          </Link>
          {" · "}
          {KIND_LABEL[post.kind]}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
          {post.title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
          {post.description}
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Обновлено: {post.updatedAt} · {CLINICAL_CONTENT_REVIEW_STATUS_RU}
        </p>
      </header>

      <div
        className="prose-clinical space-y-3 text-sm leading-relaxed text-[var(--clinical-foreground)] [&_a]:font-medium [&_a]:text-[var(--clinical-primary-deep)] [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--clinical-border)] [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-[var(--clinical-border)] [&_th]:bg-[var(--clinical-muted)] [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <section className="space-y-3" aria-labelledby="blog-sources">
        <h2 id="blog-sources" className="text-lg font-semibold text-[var(--clinical-foreground)]">
          Источники
        </h2>
        <ul className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
          {post.sources.map((source) => (
            <li key={source.label}>
              {source.href ? (
                <Link
                  href={source.href}
                  className="font-medium text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
                  {...(source.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {source.label}
                  {source.year ? ` (${source.year})` : ""}
                </Link>
              ) : (
                <span>
                  {source.label}
                  {source.year ? ` (${source.year})` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="blog-related">
        <h2 id="blog-related" className="text-lg font-semibold text-[var(--clinical-foreground)]">
          Связанные материалы
        </h2>
        <ul className="flex flex-wrap gap-2">
          {post.related.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-1.5 text-xs font-semibold text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ContentErrorReportLink pagePath={`/blog/${post.slug}`} />

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {CLINICAL_CONTENT_DISCLAIMER}
      </p>
    </article>
  );
}
