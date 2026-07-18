import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BIOMETRY_DISCLAIMER, FETAL_BIOMETRY_FORMULAS } from "@/lib/education/fetal-biometry-formulas";

export const metadata = {
  title: "Fetal biometry · формулы ISUOG",
  description: "Прозрачность формул: Papageorghiou, Hadlock, Yudkin — источники и диапазоны.",
};

export default function FetalBiometryFormulasPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/tools/refs/isuog-guidelines">← ISUOG Hub</Link>
      </Button>
      <h1 className="text-3xl font-semibold">Fetal biometry · формулы и источники</h1>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">{BIOMETRY_DISCLAIMER}</p>
      <div className="space-y-3">
        {FETAL_BIOMETRY_FORMULAS.map((f) => (
          <Card key={f.parameter}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {f.parameter}
                <Badge variant="outline">{f.rangeWeeks}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <strong>Назначение:</strong> {f.purpose}
              </p>
              <p>
                <strong>Формула:</strong> {f.formula}
              </p>
              <p className="text-[var(--clinical-foreground-muted)]">
                <strong>Reference:</strong> {f.reference}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Link href="/calculators/fetal-weight" className="text-sm font-medium text-[var(--clinical-primary)] underline">
        Калькулятор массы плода →
      </Link>
    </div>
  );
}
