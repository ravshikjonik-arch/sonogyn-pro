import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REF_LINKS = [
  { href: "/tools/refs/guidelines", label: "КР и приказы" },
  { href: "/tools/refs/norms", label: "Клинические нормы УЗИ" },
  { href: "/tools/refs/consensus", label: "Консенсусы · нормы по сроку" },
  { href: "/tools/refs/nosologies", label: "Нозологии" },
  { href: "/tools/refs/evidence", label: "Доказательная база" },
  { href: "/tools/refs/orads-guide", label: "O-RADS · руководство" },
  { href: "/tools/refs/iota-terms-2026", label: "IOTA 2026 · термины" },
  { href: "/tools/refs/basic-course", label: "ISUOG · базовый курс" },
];

type Props = { params: Promise<{ slug?: string[] }> };

function RefsHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header>
        <h1 className="text-2xl font-black">Справочники</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          КР, нормы, нозологии, учебные материалы
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {REF_LINKS.map((item) => (
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
      <Button asChild variant="outline" size="sm">
        <Link href="/library">Курсы и прочее (legacy hub)</Link>
      </Button>
    </div>
  );
}

/** /tools/refs hub; unmigrated paths fall back to /library/* */
export default async function ToolsRefsCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <RefsHub />;
  redirect(`/library/${slug.join("/")}`);
}
