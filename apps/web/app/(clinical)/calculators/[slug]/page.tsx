import Link from "next/link";
import { notFound } from "next/navigation";

import { CalculatorEntryForm, type CalculatorHistoryRow } from "@/components/calculators/calculator-entry-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCalculatorBySlug } from "@/lib/calculators/registry";
import { createClient } from "@/utils/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export default async function CalculatorDetailPage(props: Props) {
  const { slug } = await props.params;
  const definition = getCalculatorBySlug(slug);
  if (!definition) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: rows } = await supabase
    .from("calculator_entries")
    .select("id,payload,summary,created_at")
    .eq("user_id", user.id)
    .eq("calculator_code", definition.code)
    .order("created_at", { ascending: false })
    .limit(20);

  const history = (rows ?? []) as CalculatorHistoryRow[];

  return (
    <div className="space-y-8 px-4 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Catalog</Link>
        </Button>
        <Badge variant="outline">{definition.code}</Badge>
      </div>

      <CalculatorEntryForm definition={definition} history={history} />
    </div>
  );
}
