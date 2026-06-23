import Link from "next/link";

import { NavigationIcon } from "@/components/clinical/NavigationIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getNavigationGroupedByDomain,
  getNavigationItemUrl,
  type NavigationItem,
} from "@repo/types";

function delayClassForIndex(index: number): string {
  if (index === 0) return "sonogyn-enter-delay-1";
  if (index === 1) return "sonogyn-enter-delay-2";
  if (index === 2) return "sonogyn-enter-delay-3";
  return "sonogyn-enter-delay-3";
}

function NavigationModuleCard({ item, index }: { item: NavigationItem; index: number }) {
  const url = getNavigationItemUrl(item);
  const isExternal = Boolean(item.externalHref);
  const badgeLabel = item.badge ?? (item.isPro ? "PRO" : null);
  const accentBar = item.accentBar ?? "bg-gradient-to-r from-slate-400 to-slate-500";

  return (
    <Card
      className={`sonogyn-tile-hover sonogyn-enter ${delayClassForIndex(index)} group flex flex-col overflow-hidden border-slate-200/90 bg-white dark:bg-[var(--clinical-card)]`}
    >
      <div className={`h-1 ${accentBar}`} />
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--clinical-primary-muted)] to-white text-[var(--clinical-primary-deep)] shadow-sm transition group-hover:scale-105">
            <NavigationIcon icon={item.icon} moduleId={item.id} className="h-5 w-5" />
          </div>
          {badgeLabel ? <Badge variant="default">{badgeLabel}</Badge> : null}
        </div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
        <CardDescription className="leading-relaxed">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-2">
        <Button variant="secondary" className="w-full group-hover:bg-[var(--clinical-primary-muted)]" asChild>
          {isExternal ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
              Открыть модуль →
            </a>
          ) : (
            <Link href={url}>Открыть модуль →</Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Кабинет врача — секции по domain из navigation.config. */
export function DoctorCabinetNavigation() {
  const sections = getNavigationGroupedByDomain();

  return (
    <div className="space-y-12">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.domain}
          className={`sonogyn-enter ${sectionIndex === 0 ? "sonogyn-enter-delay-1" : "sonogyn-enter-delay-2"}`}
          aria-labelledby={`cabinet-domain-${section.domain}`}
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--clinical-border)] pb-3">
            <h2
              id={`cabinet-domain-${section.domain}`}
              className="text-xl font-black tracking-tight text-slate-950 dark:text-white"
            >
              {section.label}
            </h2>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--clinical-foreground-muted)]">
              {section.items.length} модулей
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item, index) => (
              <NavigationModuleCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
