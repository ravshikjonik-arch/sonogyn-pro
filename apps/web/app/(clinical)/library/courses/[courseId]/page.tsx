import type { Metadata } from "next";
import Link from "next/link";

import { CourseDetailClient } from "@/components/courses/CourseDetailClient";
import { fetchPublishedCourseDetail } from "@/lib/courses/public-queries";
import { createClient } from "@/utils/supabase/server";

type PageProps = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const supabase = await createClient();
  const course = await fetchPublishedCourseDetail(supabase, courseId);
  if (!course) return { title: "Курс не найден" };

  const description = course.description_html.replace(/<[^>]+>/g, " ").slice(0, 160);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru";

  return {
    title: `${course.title} · SonoGyn Pro`,
    description,
    openGraph: {
      title: course.title,
      description,
      type: "website",
      url: `${appUrl}/library/courses/${courseId}`,
      images: course.coverUrl ? [{ url: course.coverUrl }] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const course = await fetchPublishedCourseDetail(supabase, courseId);

  const jsonLd = course
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.description_html.replace(/<[^>]+>/g, " ").slice(0, 500),
        provider: {
          "@type": "Organization",
          name: "SonoGyn Pro",
        },
        offers: {
          "@type": "Offer",
          price: course.price_rub,
          priceCurrency: "RUB",
        },
      }
    : null;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/library/courses" className="text-sm text-[var(--clinical-primary)] underline">
          ← Каталог курсов
        </Link>
        {jsonLd ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        ) : null}
        <CourseDetailClient courseId={courseId} />
      </div>
    </div>
  );
}
