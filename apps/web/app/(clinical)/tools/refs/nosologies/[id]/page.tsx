import { Suspense } from "react";

import { NosologyDetailClient } from "@/components/nosology/NosologyDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function NosologyDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <NosologyDetailClient id={id} />
    </Suspense>
  );
}
