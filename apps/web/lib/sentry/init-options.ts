import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";

import {
  isClinicalRoutePath,
  isReplayBlockedPath,
  isSentryEnabled,
  resolveReplayOnErrorSampleRate,
  resolveReplaySessionSampleRate,
  resolveSentryDsn,
  resolveSentryEnvironment,
  resolveSentryRelease,
  resolveTracesSampleRate,
  shouldStripAllQueryParams,
} from "./flags";
import { scrubSentryEvent } from "./scrub-event";

type SharedInit = Pick<
  BrowserOptions & NodeOptions,
  "dsn" | "environment" | "release" | "tracesSampleRate" | "sendDefaultPii" | "beforeSend" | "beforeBreadcrumb"
>;

export function buildSentrySharedInit(): SharedInit | null {
  if (!isSentryEnabled()) return null;

  return {
    dsn: resolveSentryDsn(),
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    tracesSampleRate: resolveTracesSampleRate(),
    sendDefaultPii: false,
    beforeSend(event, hint) {
      if (event.request?.url && isClinicalRoutePath(event.request.url)) {
        delete event.request.data;
        delete event.request.query_string;
      }
      return scrubSentryEvent(event, hint);
    },
    beforeBreadcrumb(breadcrumb) {
      const url = breadcrumb.data?.url as string | undefined;
      if (url && isClinicalRoutePath(url)) return null;
      if (breadcrumb.category === "console" && breadcrumb.level === "log") return null;
      return breadcrumb;
    },
  };
}

export function buildSentryClientExtras(): Partial<BrowserOptions> {
  const blocked =
    typeof window !== "undefined" && isReplayBlockedPath(window.location.pathname);

  return {
    replaysSessionSampleRate: blocked ? 0 : resolveReplaySessionSampleRate(),
    replaysOnErrorSampleRate: blocked ? 0 : resolveReplayOnErrorSampleRate(),
    beforeSendTransaction(event) {
      if (event.request?.url && shouldStripAllQueryParams(event.request.url)) {
        event.request.url = pathWithoutQuery(event.request.url);
      }
      return event;
    },
  };
}

function pathWithoutQuery(url: string): string {
  try {
    const parsed = new URL(url, "https://sonogyn.local");
    return parsed.pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}
