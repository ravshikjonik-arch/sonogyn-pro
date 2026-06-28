import DOMPurify from "isomorphic-dompurify";

const COURSE_HTML_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "span",
] as const;

const COURSE_HTML_ALLOWED_ATTR = ["href", "target", "rel", "class"] as const;

/** Sanitize LMS rich text (author HTML → student view). Defense in depth on read + write. */
export function sanitizeCourseHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...COURSE_HTML_ALLOWED_TAGS],
    ALLOWED_ATTR: [...COURSE_HTML_ALLOWED_ATTR],
    ALLOW_DATA_ATTR: false,
  });
}

/** Plain-text lesson description wrapped as safe HTML paragraph. */
export function descriptionToSafeHtml(description: string): string {
  const escaped = description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return `<p>${escaped}</p>`;
}

export function lessonBodyHtmlForDisplay(bodyHtml: string | undefined | null, description: string | null | undefined): string {
  if (bodyHtml?.trim()) return sanitizeCourseHtml(bodyHtml);
  if (description?.trim()) return descriptionToSafeHtml(description.trim());
  return "";
}
