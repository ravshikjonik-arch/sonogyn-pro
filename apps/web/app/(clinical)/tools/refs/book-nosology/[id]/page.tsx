import type { Metadata } from "next";

import { BookNosologyDetailClient } from "@/components/nosology/BookNosologyDetailClient";
import { getBookNosologyEntry } from "@repo/book-nosology-registry";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = getBookNosologyEntry(decodeURIComponent(id));
  return {
    title: entry ? `${entry.titleRu} · атлас книги` : "Атлас · нозология",
    description: entry?.summaryRu?.slice(0, 160),
  };
}

export default async function BookNosologyPage({ params }: Props) {
  const { id } = await params;
  return <BookNosologyDetailClient entryId={decodeURIComponent(id)} />;
}
