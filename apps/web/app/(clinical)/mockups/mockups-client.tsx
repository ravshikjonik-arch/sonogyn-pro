"use client";

import { ArrowDownUp, CircleDot, Heart, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MOCKUP_ROUTES,
  readMockupNavPrefs,
  saveMockupNavPrefs,
  swapMockupSidebarOrder,
  type MockupId,
  type MockupNavPrefs,
} from "@/lib/mockups/mockup-nav-prefs";

const CARD_META: Record<
  MockupId,
  { icon: typeof Stethoscope; badge: string; accent: string }
> = {
  uterus: {
    icon: Stethoscope,
    badge: "FIGO",
    accent: "from-indigo-500 to-blue-500",
  },
  breast: {
    icon: Heart,
    badge: "BI-RADS",
    accent: "from-pink-500 to-rose-500",
  },
  ovary: {
    icon: CircleDot,
    badge: "O-RADS · ИИ",
    accent: "from-violet-500 to-purple-500",
  },
};

export function MockupsHubClient() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<MockupNavPrefs>(() => readMockupNavPrefs());

  useEffect(() => {
    setPrefs(readMockupNavPrefs());
  }, []);

  const setDefault = useCallback((id: MockupId) => {
    const next = { ...prefs, defaultMockup: id };
    saveMockupNavPrefs(next);
    setPrefs(next);
  }, [prefs]);

  const swapOrder = useCallback(() => {
    setPrefs(swapMockupSidebarOrder(prefs));
  }, [prefs]);

  const openDefault = useCallback(() => {
    router.push(MOCKUP_ROUTES[prefs.defaultMockup].href);
  }, [prefs.defaultMockup, router]);

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="sonogyn-glass-card space-y-3 rounded-3xl p-6 sm:p-8">
          <Badge variant="outline">Макеты · протокол</Badge>
          <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">Макеты на выбор</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Матка, яичник и молочная железа — отдельные модули. Порядок в боковом меню и макет по умолчанию настраиваются
            здесь.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={openDefault}>
              Открыть по умолчанию ({MOCKUP_ROUTES[prefs.defaultMockup].label})
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={swapOrder}>
              <ArrowDownUp className="h-4 w-4" />
              Поменять порядок в меню
            </Button>
          </div>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Сейчас в меню:{" "}
            <strong>
              {prefs.sidebarOrder.map((id) => MOCKUP_ROUTES[id].label).join(" → ")}
            </strong>
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {prefs.sidebarOrder.map((id) => {
            const meta = MOCKUP_ROUTES[id];
            const visual = CARD_META[id];
            const Icon = visual.icon;
            const isDefault = prefs.defaultMockup === id;
            return (
              <Card
                key={id}
                className="sonogyn-tile-hover overflow-hidden border-[var(--clinical-border)]"
              >
                <div className={`h-1.5 bg-gradient-to-r ${visual.accent}`} />
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--clinical-primary-muted)]">
                      <Icon className="h-6 w-6 text-[var(--clinical-primary-deep)]" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{visual.badge}</Badge>
                      {isDefault ? (
                        <Badge variant="outline" className="text-[10px]">
                          По умолчанию
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <CardTitle>{meta.label}</CardTitle>
                  <CardDescription className="leading-relaxed">{meta.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button className="w-full" asChild>
                    <Link href={meta.href}>Открыть макет →</Link>
                  </Button>
                  <Button
                    type="button"
                    variant={isDefault ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full"
                    onClick={() => setDefault(id)}
                  >
                    {isDefault ? "Это макет по умолчанию" : "Сделать по умолчанию"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
          Учебные схемы. Не заменяют УЗИ. Заключение — за лечащим врачом.
        </p>
      </div>
    </div>
  );
}
