"use client";

import {
  NOSOLOGY_LITERATURE,
  pubmedSearchUrlForNosology,
  resolveNosologyLiterature,
  type Nosology,
} from "@repo/nosology";

import { PubmedLiteraturePanel } from "@/components/pubmed/PubmedLiteraturePanel";

type Props = {
  nosology: Nosology;
  className?: string;
};

export function NosologyLiteraturePanel({ nosology, className }: Props) {
  const items = resolveNosologyLiterature(nosology, NOSOLOGY_LITERATURE);

  return (
    <PubmedLiteraturePanel
      pubmedHref={pubmedSearchUrlForNosology(nosology)}
      items={items}
      extraLinks={[{ href: "/evidence", label: "SonoEvidence" }]}
      className={className}
    />
  );
}
