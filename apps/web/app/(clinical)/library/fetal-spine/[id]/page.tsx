import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FetalSpineCardDetailClient } from "@/components/education/fetal-spine/FetalSpineCardDetailClient";
import { Button } from "@/components/ui/button";
import { cardsData, getCardById } from "@/lib/education/fetal-spine/cardsData";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return cardsData.map((card) => ({ id: String(card.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cardId = Number(id);
  const card = Number.isFinite(cardId) ? getCardById(cardId) : undefined;
  if (!card) return { title: "Карточка не найдена" };
  return {
    title: `${card.title} · позвоночник плода`,
    description: card.tags.join(", "),
  };
}

export default async function FetalSpineCardPage({ params }: Props) {
  const { id } = await params;
  const cardId = Number(id);
  const card = Number.isFinite(cardId) ? getCardById(cardId) : undefined;

  if (!card) notFound();

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/library/fetal-spine">
            <ArrowLeft className="mr-1 h-4 w-4" />
            УЗИ позвоночника плода
          </Link>
        </Button>
        <FetalSpineCardDetailClient card={card} />
      </div>
    </div>
  );
}
