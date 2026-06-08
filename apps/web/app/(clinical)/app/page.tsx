import {
  Activity,
  Brain,
  Calculator,
  Layers,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tiles = [
  {
    title: "Evidence calculators",
    description: "Radiology-pathology lexicon aligned scoring assistants.",
    href: "/calculators",
    icon: Calculator,
    badge: "CDS",
  },
  {
    title: "Case collaboration",
    description: "Realtime discussion feed with likes & bookmarks.",
    href: "/cases",
    icon: Activity,
    badge: "Realtime",
  },
  {
    title: "Clinical library",
    description: "Protocols, checklists, and imaging atlases (stub content).",
    href: "/library",
    icon: Layers,
    badge: "Education",
  },
  {
    title: "3D uterus workspace",
    description: "React Three Fiber scene with pathology placement markers.",
    href: "/uterus-3d",
    icon: Stethoscope,
    badge: "Visual",
  },
  {
    title: "AI imaging workspace",
    description: "Upload-safe pipeline with orchestrator & CDS preview.",
    href: "/workspace",
    icon: Brain,
    badge: "AI",
  },
];

export default function CommandCenterPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-3">
          <Badge variant="outline">Command Center · signed-in surface</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Orchestrate ultrasound workflows
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--clinical-foreground-muted)]">
            This hub mirrors workstation shells found in enterprise PACS — prioritizing clarity,
            low cognitive load, and predictable navigation across calculators, education, AI assists,
            and procedural planning assets.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Card key={tile.href} className="flex flex-col border-slate-200/90 bg-white">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="default">{tile.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg">{tile.title}</CardTitle>
                  <CardDescription>{tile.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-2">
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href={tile.href}>Open module</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
