import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { ClinicAccreditationClient } from "@/components/education/ClinicAccreditationClient";
import {
  ACCREDITATION_ITEM_COUNT,
  ACCREDITATION_SECTIONS,
  CLINIC_ACCREDITATION_DISCLAIMER,
  CLINIC_ACCREDITATION_LINKS,
  CLINIC_ACCREDITATION_MODULE_TITLE_RU,
} from "@/lib/education/clinic-accreditation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Аккредитация кабинета УЗИ · AIUM-style",
  description:
    "Интерактивный чек-лист самооценки кабинета УЗД по принципам AIUM Practice Accreditation: персонал, QA, документирование, ALARA.",
};

export default function ClinicAccreditationPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={CLINIC_ACCREDITATION_LINKS.library.href}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {CLINIC_ACCREDITATION_LINKS.library.label}
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">AIUM</Badge>
              <Badge variant="outline">{ACCREDITATION_SECTIONS.length} раздела</Badge>
              <Badge variant="outline">{ACCREDITATION_ITEM_COUNT} пунктов</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Building2 className="h-8 w-8 text-[var(--clinical-primary)]" />
              {CLINIC_ACCREDITATION_MODULE_TITLE_RU}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Самооценка готовности кабинета: персонал, оборудование, QA, протоколы, безопасность и работа с пациенткой.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{CLINIC_ACCREDITATION_DISCLAIMER}</p>
          </div>
        </header>
        <ClinicAccreditationClient />
      </div>
    </div>
  );
}
