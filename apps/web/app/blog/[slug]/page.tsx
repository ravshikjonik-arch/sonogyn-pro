import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticleShell } from "@/components/seo/BlogArticleShell";
import { getBlogPost, listBlogPosts } from "@/lib/seo/blog-posts";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return buildPublicMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return (
    <main id="main-content">
      <BlogArticleShell post={post} />
    </main>
  );
}
