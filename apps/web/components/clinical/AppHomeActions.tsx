"use client";

import Link from "next/link";

import { ClinicalToolSearchTrigger } from "@/components/clinical/ClinicalToolSearchDialog";
import { Button } from "@/components/ui/button";

export function AppHomeActions() {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Button asChild className="sonogyn-cta-glow">
        <Link href="/cases">Чат врачей</Link>
      </Button>
      <ClinicalToolSearchTrigger />
      <Button variant="secondary" asChild>
        <Link href="/tools/calc/ob">Срок беременности</Link>
      </Button>
      <Button variant="secondary" asChild>
        <Link href="/tools/calc">Калькуляторы</Link>
      </Button>
    </div>
  );
}
