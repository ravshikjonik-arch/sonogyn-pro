"use client";

import { useEffect } from "react";

import { captureSafeException } from "@/lib/sentry/capture-safe";

/** Report to Sentry without attaching raw error.message (may contain PHI). */
export function useSafeSentryCapture(
  error: Error & { digest?: string },
  scope: { boundary: string },
): void {
  useEffect(() => {
    captureSafeException(error, scope);
  }, [error, scope.boundary]);
}
