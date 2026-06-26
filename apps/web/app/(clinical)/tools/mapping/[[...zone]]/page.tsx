import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAPPING_LINKS = [
  { href: "/tools/mapping/uterus", label: "Матка · FIGO / MUSA" },
  { href: "/tools/mapping/ovary", label: "Яичник · O-RADS / IOTA" },
  { href: "/tools/mapping/breast", label: "Молочная железа · BI-RADS" },
  { href: "/tools/mapping/endometriosis", label: "Эндометриоз · ENZIAN" },
];

type Props = { params: Promise<{ zone?: string[] }> };

function MappingHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header>
        <h1 className="text-2xl font-black">Anatomical Mapping</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Анатомия как инструмент ввода — не визуальная витрина (P1).
        </p>
      </header>
      <div className="grid gap-3">
        {MAPPING_LINKS.map((item) => (
          <Card key={item.href}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href={item.href}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** P1: /tools/mapping hub; zone pages live at /tools/mapping/{zone}/page.tsx */
export default async function ToolsMappingCatchAllPage({ params }: Props) {
  const { zone = [] } = await params;
  if (zone.length === 0) return <MappingHub />;
  redirect("/tools/mapping");
}
