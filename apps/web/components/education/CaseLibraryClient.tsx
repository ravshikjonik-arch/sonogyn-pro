"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CASE_LIBRARY_BUNDLES,
  CASE_LIBRARY_DISCLAIMER,
  CASE_LIBRARY_TOTAL,
} from "@/lib/education/case-library/bundles";

export function CaseLibraryClient() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--clinical-foreground-muted)]">
        {CASE_LIBRARY_BUNDLES.length} подборок · ~{CASE_LIBRARY_TOTAL}+ учебных кейсов из модулей SonoGyn Pro.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {CASE_LIBRARY_BUNDLES.map((bundle) => (
          <Card key={bundle.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{bundle.titleRu}</CardTitle>
                <Badge variant="outline">{bundle.badge}</Badge>
              </div>
              <CardDescription>{bundle.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <div className="flex flex-wrap gap-1">
                {bundle.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href={bundle.href}>
                  <BookOpen className="mr-1 h-4 w-4" />
                  Открыть {bundle.caseCount > 0 ? `· ${bundle.caseCount} cases` : ""}
                  <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">{CASE_LIBRARY_DISCLAIMER}</p>
    </div>
  );
}
