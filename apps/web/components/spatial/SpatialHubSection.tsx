"use client";

import { Suspense } from "react";

import { SpatialHubExplorer } from "@/components/spatial/SpatialHubExplorer";

type SpatialHubSectionProps = {
  basePath: "/home" | "/profile/dashboard";
  title?: string;
  subtitle?: string;
};

export function SpatialHubSection({ basePath, title, subtitle }: SpatialHubSectionProps) {
  return (
    <section className="space-y-3">
      {title ? (
        <div className="px-1">
          <h2 className="text-lg font-black tracking-tight text-[var(--clinical-foreground)]">{title}</h2>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
      <Suspense fallback={null}>
        <SpatialHubExplorer basePath={basePath} />
      </Suspense>
    </section>
  );
}
