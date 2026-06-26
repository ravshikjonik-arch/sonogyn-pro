import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAPPING_LINKS = [
  { href: "/tools/mapping/uterus", label: "Матка · FIGO / MUSA", legacy: "/uterus-3d" },
  { href: "/tools/mapping/ovary", label: "Яичник · O-RADS / IOTA", legacy: "/ovary-atlas" },
  { href: "/tools/mapping/breast", label: "Молочная железа · BI-RADS", legacy: "/breast-3d" },
  { href: "/tools/mapping/endometriosis", label: "Эндометриоз · ENZIAN", legacy: "/idea-deep-endometriosis" },
];

const LEGACY_MAPPING: Record<string, string> = {
  uterus: "/uterus-3d",
  ovary: "/ovary-atlas",
  breast: "/breast-3d",
  endometriosis: "/idea-deep-endometriosis",
};

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
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={item.href}>Открыть</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={item.legacy}>Legacy UI</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** P1: /tools/mapping hub + zone redirects to legacy mockups. */
export default async function ToolsMappingCatchAllPage({ params }: Props) {
  const { zone = [] } = await params;
  if (zone.length === 0) return <MappingHub />;
  redirect(LEGACY_MAPPING[zone[0] ?? ""] ?? "/tools/mapping");
}
