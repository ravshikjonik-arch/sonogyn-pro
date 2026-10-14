import { sanitizeCourseHtml } from "@/lib/security/sanitize-course-html";

/** Sanitize clinical narrative HTML (protocol / case description). */
export function sanitizeClinicalHtml(html: string): string {
  return sanitizeCourseHtml(html);
}

export { descriptionToSafeHtml } from "@/lib/security/sanitize-course-html";
