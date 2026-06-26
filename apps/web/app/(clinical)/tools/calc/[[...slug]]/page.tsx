import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CALC_LINKS = [
  { href: "/tools/calc/rads/o-rads", label: "O-RADS Pro" },
  { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
  { href: "/tools/calc/ob", label: "Срок беременности" },
  { href: "/tools/calc/gyn/pop-q", label: "POP-Q" },
  { href: "/tools/calc/gyn/colposcopy", label: "Кольпоскопия" },
];

type Props = { params: Promise<{ slug?: string[] }> };

function CalcHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header>
        <h1 className="text-2xl font-black">Калькуляторы</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">По гайдлайнам и КР РФ</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {CALC_LINKS.map((item) => (
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
        <Link href="/calculators">Полный каталог (legacy)</Link>
      </Button>
    </div>
  );
}

/** P1 bridge: /tools/calc hub + /tools/calc/* → /calculators/* */
export default async function ToolsCalcCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;

  if (slug.length === 0) return <CalcHub />;

  const path = slug.join("/");

  if (path === "ob") redirect("/calculators/ob");
  if (path.startsWith("ob/")) redirect(`/calculators/${path.slice(3)}`);
  if (path.startsWith("rads/")) {
    if (path === "rads/adnex-report") redirect("/reports/adnex");
    if (path === "rads/o-rads") redirect("/tools/calc/rads/o-rads");
    if (path === "rads/bi-rads") redirect("/tools/calc/rads/bi-rads");
    if (path === "rads/ln-rads") redirect("/tools/calc/rads/ln-rads");
    redirect(`/calculators/${path.slice(5)}`);
  }
  if (path.startsWith("gyn/")) redirect(`/calculators/${path.slice(4)}`);

  redirect(`/calculators/${path}`);
}
