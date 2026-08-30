import type { ErrorEvent, EventHint } from "@sentry/nextjs";

import { isClinicalRoutePath } from "./flags";

const SECRET_KEY_FRAGMENTS = [
  "secret",
  "token",
  "password",
  "authorization",
  "api_key",
  "apikey",
  "bearer",
  "credential",
  "private_key",
  "service_role",
  "jwt",
  "cookie",
  "session",
  "supabase",
  "signed",
  "signature",
];

const PII_KEY_FRAGMENTS = [
  "display_label",
  "full_name",
  "firstname",
  "lastname",
  "surname",
  "phone",
  "email",
  "lmp",
  "date_of_birth",
  "birth_date",
  "dob",
  "external_ref",
  "conclusion",
  "diagnosis",
  "patient",
  "snils",
  "polis",
  "otp",
  "description_html",
  "conclusion_html",
  "body",
  "media_storage_path",
  "messages",
  "message",
  "content",
  "prompt",
  "systemprompt",
  "system_prompt",
  "tool_results",
  "protocol",
  "report",
  "biometry",
  "study_id",
  "patient_id",
  "case_id",
  "media_id",
  "dicom",
  "instance_uid",
  "series_uid",
  "sop_class",
  "filename",
  "file_name",
  "filepath",
  "storage_path",
  "image",
  "base64",
  "thumbnail",
  "screenshot",
  "form_data",
  "user_input",
  "query_string",
];

/** Patterns in free-text values (signed URLs, JWT, base64 blobs). */
const VALUE_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  /https?:\/\/[^\s]*\/storage\/v1\/object\/sign\/[^\s]+/gi,
  /data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]{40,}/gi,
  /[A-Za-z0-9+/=]{200,}/g,
];

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    SECRET_KEY_FRAGMENTS.some((p) => k.includes(p)) ||
    PII_KEY_FRAGMENTS.some((p) => k.includes(p))
  );
}

function scrubStringValue(value: string): string {
  let out = value;
  for (const pattern of VALUE_PATTERNS) {
    out = out.replace(pattern, "[redacted]");
  }
  if (out.length > 500) {
    return `${out.slice(0, 500)}…[truncated]`;
  }
  return out;
}

function redactValue(key: string, value: unknown, depth = 0): unknown {
  if (isSensitiveKey(key)) return "[redacted]";
  if (depth > 5) return "[depth-limit]";
  if (typeof value === "string") return scrubStringValue(value);
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => redactValue("", v, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(k, v, depth + 1);
    }
    return out;
  }
  return value;
}

function scrubRequestUrl(url: string | undefined, stripAllQuery = false): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url, "https://sonogyn.local");
    if (stripAllQuery) {
      return parsed.pathname;
    }
    for (const key of [...parsed.searchParams.keys()]) {
      if (isSensitiveKey(key)) parsed.searchParams.set(key, "[redacted]");
    }
    return parsed.pathname + (parsed.search ? parsed.search : "");
  } catch {
    return "[invalid-url]";
  }
}

function scrubBreadcrumbs(event: ErrorEvent): void {
  if (!event.breadcrumbs?.length) return;
  event.breadcrumbs = event.breadcrumbs
    .map((bc) => {
      const url = bc.data?.url as string | undefined;
      if (url && isClinicalRoutePath(url)) return null;
      if (bc.data) {
        bc.data = redactValue("", bc.data) as Record<string, unknown>;
      }
      if (typeof bc.message === "string") {
        bc.message = scrubStringValue(bc.message);
      }
      return bc;
    })
    .filter(Boolean) as ErrorEvent["breadcrumbs"];
}

/** Drop or scrub PHI/secrets before sending to Sentry/GlitchTip. */
export function scrubSentryEvent(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const clinicalUrl = event.request?.url && isClinicalRoutePath(event.request.url);

  if (event.request) {
    event.request.url = scrubRequestUrl(event.request.url, Boolean(clinicalUrl));
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (isSensitiveKey(key)) headers[key] = "[redacted]";
      }
      event.request.headers = headers;
    }
  }

  if (event.extra) {
    event.extra = redactValue("", event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = redactValue("", event.contexts) as ErrorEvent["contexts"];
  }
  if (event.user) {
    event.user = {
      id: event.user.id,
      ip_address: "{{auto}}",
    };
  }

  scrubBreadcrumbs(event);

  const original = hint.originalException;
  if (original && typeof original === "object" && "context" in original) {
    (original as { context?: unknown }).context = redactValue(
      "context",
      (original as { context?: unknown }).context,
    );
  }

  if (typeof event.message === "string") {
    event.message = scrubStringValue(event.message);
  }

  return event;
}

export { PII_KEY_FRAGMENTS, SECRET_KEY_FRAGMENTS, isSensitiveKey, scrubStringValue };
