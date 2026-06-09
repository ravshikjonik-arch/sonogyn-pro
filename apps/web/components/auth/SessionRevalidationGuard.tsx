"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/app/providers";
import { useSessionRevalidation } from "@/hooks/useSessionRevalidation";

/** Оборачивает клиническую зону — 24h offline policy + getUser online. */
export function SessionRevalidationGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  useSessionRevalidation(ready && !!user);
  return children;
}
