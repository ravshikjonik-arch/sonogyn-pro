import Link from "next/link";
import { Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ULTRASOUND_SAFETY_DISCLAIMER, ULTRASOUND_SAFETY_STATEMENTS } from "@/lib/education/ultrasound-safety";

export const metadata = {
  title: "Безопасность УЗИ · ISUOG / AIUM",
  description: "ALARA, bioeffects, MI/TI, doppler I trimester, training.",
};

export default function UltrasoundSafetyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/tools/refs">← Библиотека</Link>
      </Button>
      <h1 className="flex items-center gap-2 text-3xl font-semibold">
        <Shield className="h-8 w-8 text-[var(--clinical-primary)]" />
        Безопасность УЗИ
      </h1>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">{ULTRASOUND_SAFETY_DISCLAIMER}</p>
      <div className="space-y-4">
        {ULTRASOUND_SAFETY_STATEMENTS.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-lg">{s.titleRu}</CardTitle>
              <CardDescription>{s.summary}</CardDescription>
              <Badge variant="outline">{s.source}</Badge>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
                  Официальный источник →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
