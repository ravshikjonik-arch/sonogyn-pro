import { sanitizeCourseHtml } from "@/lib/security/sanitize-course-html";

type LessonFields = {
  body_html?: string;
  description?: string | null;
};

type CourseFields = {
  description_html?: string;
};

export function sanitizeLessonUpsertFields<T extends LessonFields>(data: T): T {
  const out = { ...data };
  if (typeof out.body_html === "string") {
    out.body_html = sanitizeCourseHtml(out.body_html);
  }
  if (typeof out.description === "string") {
    out.description = out.description.trim() || null;
  }
  return out;
}

export function sanitizeCourseUpsertFields<T extends CourseFields>(data: T): T {
  const out = { ...data };
  if (typeof out.description_html === "string") {
    out.description_html = sanitizeCourseHtml(out.description_html);
  }
  return out;
}
