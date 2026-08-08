import type { ReactNode } from "react";

import { SpatialCard } from "@/components/spatial/SpatialCard";

type KnowledgeNode = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function KnowledgeConstellation({ nodes }: { nodes: KnowledgeNode[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {nodes.map((node) => (
        <SpatialCard key={node.title} depth={1} className="p-3">
          <div className="flex items-start gap-3">
            {node.icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--sg-radius-sm)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                {node.icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--clinical-foreground)]">{node.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                {node.description}
              </p>
            </div>
          </div>
        </SpatialCard>
      ))}
    </div>
  );
}
