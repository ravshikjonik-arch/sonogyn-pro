import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRareSlot, type FeedCaseRow } from "@/lib/cases/feed-curation";
import { formatLifecycleLabel, resolveCaseLifecycle } from "@/lib/cases/lifecycle-labels";
import { cn } from "@/lib/utils/cn";

type Props = {
  item: FeedCaseRow;
  variant?: "featured" | "compact";
};

/** Editorial case card — без media thumb (gate R6). */
export function FeedCaseCard({ item, variant = "compact" }: Props) {
  const lifecycle = resolveCaseLifecycle(item.lifecycle_status, item.status);
  const lifecycleLabel = formatLifecycleLabel(lifecycle);
  const rareLabel = item.is_rare ? formatRareSlot(item.rare_slot) ?? "Редкий случай" : null;

  return (
    <Card
      className={cn(
        "border-[var(--clinical-border)]",
        variant === "featured" && "border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/20",
      )}
    >
      <CardHeader className={cn("pb-2", variant === "compact" && "py-4")}>
        <CardTitle className={cn("leading-snug", variant === "featured" ? "text-xl" : "text-base")}>
          <Link href={`/cases/${item.id}`} className="hover:underline">
            {item.title}
          </Link>
        </CardTitle>
        {item.description ? (
          <CardDescription className={cn(variant === "featured" ? "line-clamp-3" : "line-clamp-2")}>
            {item.description}
          </CardDescription>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {lifecycleLabel ? (
            <Badge
              variant="outline"
              className={cn(lifecycle === "confirmed" && "border-emerald-600 text-emerald-800")}
            >
              {lifecycleLabel}
            </Badge>
          ) : null}
          {rareLabel ? (
            <Badge className="bg-amber-700">{rareLabel}</Badge>
          ) : null}
          {item.anatomy ? <Badge variant="outline">{item.anatomy}</Badge> : null}
          {item.orads_category != null ? (
            <Badge className="bg-violet-600">O-RADS {item.orads_category}</Badge>
          ) : null}
          {item.pathology_tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.channel_id ? (
            <Badge variant="outline" className="border-emerald-700 text-emerald-800">
              обсуждение
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      {variant === "featured" ? (
        <CardContent className="pt-0">
          <Link
            href={`/cases/${item.id}`}
            className="text-sm font-semibold text-[var(--clinical-primary-deep)] hover:underline"
          >
            Открыть кейс →
          </Link>
        </CardContent>
      ) : null}
    </Card>
  );
}
