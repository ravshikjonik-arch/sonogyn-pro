import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { PatientInformationClient } from "@/components/patient-information/PatientInformationClient";
import { PATIENT_INFO_DISCLAIMER, PATIENT_LEAFLETS } from "@/lib/patient-information";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Информация для пациенток · ISUOG-style leaflets",
  description:
    "Листовки для пациенток: шейка матки, O-RADS, цитология, задержка роста плода, скрининг I триместра. Печать, PDF, email.",
};

export default function PatientInformationPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Библиотека
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">ISUOG-style</Badge>
              <Badge variant="outline">{PATIENT_LEAFLETS.length} листовок</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <FileText className="h-8 w-8 text-[var(--clinical-primary)]" />
              Информация для пациенток
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Готовые листовки на понятном языке — распечатать, сохранить PDF или отправить пациентке по email после
              консультации или УЗИ.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{PATIENT_INFO_DISCLAIMER}</p>
          </div>
        </header>

        <PatientInformationClient />
      </div>
    </div>
  );
}
