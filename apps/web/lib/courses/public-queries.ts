import type { SupabaseClient } from "@supabase/supabase-js";

import { getCourseMediaSignedUrl } from "@/lib/courses/storage";
import { resolveVideoProvider } from "@/lib/courses/video-url";
import type { CourseWithTree } from "@/lib/courses/types";
import { fetchCourseTree } from "@/lib/courses/queries";

export type PublicAuthorInfo = {
  userId: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  telegram: string | null;
  website: string | null;
};

export type PublicCourseDetail = CourseWithTree & {
  coverUrl: string | null;
  author: PublicAuthorInfo;
  lessonCount: number;
};

export async function fetchPublicAuthor(
  supabase: SupabaseClient,
  authorId: string,
): Promise<PublicAuthorInfo> {
  const [{ data: profile }, { data: authorProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", authorId).maybeSingle(),
    supabase
      .from("author_profiles")
      .select("bio, avatar_url, telegram, website")
      .eq("user_id", authorId)
      .maybeSingle(),
  ]);

  return {
    userId: authorId,
    fullName: (profile?.full_name as string | null) ?? null,
    bio: (authorProfile?.bio as string | null) ?? null,
    avatarUrl: (authorProfile?.avatar_url as string | null) ?? null,
    telegram: (authorProfile?.telegram as string | null) ?? null,
    website: (authorProfile?.website as string | null) ?? null,
  };
}

export async function fetchPublishedCourseDetail(
  supabase: SupabaseClient,
  courseId: string,
): Promise<PublicCourseDetail | null> {
  const tree = await fetchCourseTree(supabase, courseId);
  if (!tree || tree.status !== "published") return null;

  const coverUrl = tree.cover_storage_path
    ? await getCourseMediaSignedUrl(supabase, tree.cover_storage_path, 7200)
    : null;

  const author = await fetchPublicAuthor(supabase, tree.author_id);
  const lessonCount = tree.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return { ...tree, coverUrl, author, lessonCount };
}

export function sanitizeLessonForPublic<T extends Record<string, unknown>>(
  lesson: T,
  hasAccess: boolean,
): T {
  if (hasAccess) {
    return {
      ...lesson,
      video_provider: resolveVideoProvider({
        videoUrl: lesson.video_url as string | null,
        videoFileKey: lesson.video_file_key as string | null,
        videoStoragePath: lesson.video_storage_path as string | null,
        explicit: lesson.video_provider as string | null,
      }),
    } as T;
  }

  return {
    id: lesson.id,
    module_id: lesson.module_id,
    title: lesson.title,
    description: lesson.description ?? null,
    lesson_type: lesson.lesson_type,
    duration_minutes: lesson.duration_minutes ?? null,
    is_free_preview: lesson.is_free_preview,
    sort_order: lesson.sort_order,
    offline_starts_at: lesson.is_free_preview ? lesson.offline_starts_at : null,
    locked: true,
  } as unknown as T;
}
