import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REF_LINKS = [
  { href: "/tools/refs/guidelines", label: "КР и приказы", legacy: "/guidelines" },
  { href: "/tools/refs/norms", label: "Клинические нормы", legacy: "/reference" },
  { href: "/tools/refs/nosologies", label: "Нозологии", legacy: "/nosologies" },
  { href: "/tools/refs/iota-terms-2026", label: "IOTA 2026", legacy: "/library/iota-terms-2026" },
  { href: "/tools/refs/basic-course", label: "ISUOG базовый курс", legacy: "/library/basic-course" },
];

const REF_LEGACY: Record<string, string> = {
  guidelines: "/guidelines",
  norms: "/reference",
  evidence: "/evidence",
  nosologies: "/nosologies",
  consensus: "/reference/norms",
  "basic-course": "/library/basic-course",
  "orads-guide": "/library/orads-guide",
  "orads-echograms": "/library/orads-echograms",
  "iota-terms-2026": "/library/iota-terms-2026",
  "cervix-pathology": "/library/cervix-pathology",
  "fetal-anatomy-22-views": "/library/fetal-anatomy-22-views",
  "fetal-doppler-first-trimester": "/library/fetal-doppler-first-trimester",
  "obstetric-atlas": "/library/obstetric-atlas",
  "fetal-spine": "/library/fetal-spine",
};

type Props = { params: Promise<{ slug?: string[] }> };

function RefsHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header>
        <h1 className="text-2xl font-black">Справочники</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Academy без отдельной зоны (R3)</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {REF_LINKS.map((item) => (
          <Card key={item.href}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href={item.legacy}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/library">Библиотека (legacy)</Link>
      </Button>
    </div>
  );
}

export default async function ToolsRefsCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <RefsHub />;

  if (slug[0] === "guidelines" && slug.length > 1) {
    redirect(`/guidelines/${slug.slice(1).join("/")}`);
  }
  if (slug[0] === "nosologies" && slug.length > 1) {
    redirect(`/nosologies/${slug.slice(1).join("/")}`);
  }

  const key = slug.join("/");
  redirect(REF_LEGACY[key] ?? `/library/${key}`);
}
