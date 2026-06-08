"use client";

import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  SECOND_TRIMESTER_SLICE_CHECKLIST,
} from "@repo/medvedev-reference";
import { getTeachForMarker } from "@repo/medvedev-reference";
import { MedvedevSliceTeachPanel } from "@/components/clinical-assistant/MedvedevTeachPanel";
import { FetalSliceSchematic } from "@/components/clinical-assistant/FetalSliceSchematic";

export function FetalSliceAtlasPanel({ teachMode = true }: { teachMode?: boolean }) {
  const [openId, setOpenId] = useState<string>(SECOND_TRIMESTER_SLICE_CHECKLIST[0]?.id ?? "head-trans");

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
        <Layers className="h-4 w-4" />
        Атлас срезов II скрининга · 18–22 нед
      </p>
      <div className="grid gap-2 lg:grid-cols-2">
        {SECOND_TRIMESTER_SLICE_CHECKLIST.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border transition-colors",
                open
                  ? "border-violet-400 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/30"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-card)]",
              )}
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 p-3 text-left"
                onClick={() => setOpenId(open ? "" : item.id)}
              >
                <FetalSliceSchematic
                  sliceId={item.id}
                  className="mt-0.5 h-14 w-20 shrink-0 text-violet-700 dark:text-violet-300"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300">
                    {item.block} · Прил. {item.appendix}
                  </p>
                  <p className="text-sm font-semibold">{item.slice}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--clinical-foreground-muted)]">
                    {item.structures.join(" · ")}
                  </p>
                </div>
                <ChevronDown
                  className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                />
              </button>
              {open ? (
                <div className="border-t border-violet-200/60 px-3 pb-3 dark:border-violet-800/60">
                  {item.markers.length ? (
                    <ul className="mt-2 space-y-1 text-[10px] text-[var(--clinical-foreground-muted)]">
                      {item.markers.map((m) => {
                        const teach = getTeachForMarker(m);
                        return (
                          <li key={m}>
                            <span className="font-semibold text-[var(--clinical-foreground)]">
                              {teach?.title ?? m}
                            </span>
                            {teach ? ` — ${teach.howToMeasure.slice(0, 80)}…` : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {teachMode ? (
                    <MedvedevSliceTeachPanel
                      sliceId={item.id}
                      slice={item.slice}
                      structures={item.structures}
                      appendix={item.appendix}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
