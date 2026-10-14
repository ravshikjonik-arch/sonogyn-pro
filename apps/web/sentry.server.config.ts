import * as Sentry from "@sentry/nextjs";

import { buildSentrySharedInit } from "@/lib/sentry/init-options";

const shared = buildSentrySharedInit();
if (shared) {
  Sentry.init({
    ...shared,
  });

  (globalThis as { Sentry?: typeof Sentry }).Sentry = Sentry;
}
