import { EvidenceWorkspace } from "@/components/evidence/EvidenceWorkspace";
import type { EvidenceShelf } from "@repo/evidence-corpus";

type Props = { searchParams: Promise<{ shelf?: string }> };

const VALID_SHELVES = new Set<EvidenceShelf>([
  "us-fmf",
  "obgyn",
  "cervix",
  "mammo",
  "onco",
  "endocrine",
  "surgery",
]);

export default async function EvidencePage({ searchParams }: Props) {
  const { shelf: rawShelf } = await searchParams;
  const initialShelf = rawShelf && VALID_SHELVES.has(rawShelf as EvidenceShelf) ? (rawShelf as EvidenceShelf) : undefined;

  return <EvidenceWorkspace initialShelf={initialShelf} />;
}
