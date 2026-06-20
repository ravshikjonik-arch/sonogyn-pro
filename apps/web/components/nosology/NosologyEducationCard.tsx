import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NOSOLOGY_EDUCATION_LINKS } from "@/lib/education/nosology-education-links";

type Props = {
  nosologyId: string;
};

export function NosologyEducationCard({ nosologyId }: Props) {
  const link = NOSOLOGY_EDUCATION_LINKS[nosologyId];
  if (!link) return null;

  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[var(--clinical-primary)]" />
          <CardTitle className="text-base">Учебный модуль</CardTitle>
          {link.badge ? <Badge variant="outline">{link.badge}</Badge> : null}
        </div>
        <CardDescription>{link.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={link.href}
          className="inline-flex rounded-2xl bg-[var(--clinical-primary-muted)] px-4 py-2 text-sm font-semibold text-[var(--clinical-primary-deep)] hover:opacity-90"
        >
          {link.title} →
        </Link>
      </CardContent>
    </Card>
  );
}
