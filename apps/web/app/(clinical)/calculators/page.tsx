import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CALCULATORS } from "@/lib/calculators/registry";

export default function CalculatorsPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <Badge variant="outline">Clinical Decision Support</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Calculator catalog</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Structured forms persist JSON payloads per user (Supabase <code className="font-mono text-xs">calculator_entries</code>
            ). Pair FIGO entries with the{" "}
            <Link href="/uterus-3d" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
              3D uterus workspace
            </Link>
            .
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CALCULATORS.map((calc) => (
            <Card key={calc.slug} className="flex flex-col border-slate-200 bg-white dark:bg-slate-900/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-lg font-semibold">{calc.title}</CardTitle>
                  <CardDescription>{calc.subtitle}</CardDescription>
                </div>
                <Badge variant="outline">{calc.code}</Badge>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm text-[var(--clinical-foreground-muted)]">
                  {calc.fields.length} structured fields · saves to your account
                </p>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={`/calculators/${calc.slug}`}>Open worksheet</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
