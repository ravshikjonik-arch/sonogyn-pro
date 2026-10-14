import * as Sentry from "@sentry/nextjs";

import { isReplayBlockedPath } from "@/lib/sentry/flags";
import { buildSentryClientExtras, buildSentrySharedInit } from "@/lib/sentry/init-options";

const shared = buildSentrySharedInit();
if (shared) {
  Sentry.init({
    ...shared,
    ...buildSentryClientExtras(),
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        networkDetailAllowUrls: [],
        networkCaptureBodies: false,
        beforeAddRecordingEvent(event) {
          if (typeof window !== "undefined" && isReplayBlockedPath(window.location.pathname)) {
            return null;
          }
          return event;
        },
      }),
    ],
  });
}
