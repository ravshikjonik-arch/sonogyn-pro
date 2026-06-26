"use client";

import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LN_ACADEMY_SECTIONS,
  getAcademySection,
} from "@/lib/ln-rads-us";

export function LnRadsAcademyPanel() {
  const [activeId, setActiveId] = useState(LN_ACADEMY_SECTIONS[0]?.id ?? "morphology_basics");
  const section = getAcademySection(activeId);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {LN_ACADEMY_SECTIONS.map((s) => (
          <CalcChip key={s.id} label={s.titleRu} selected={activeId === s.id} onClick={() => setActiveId(s.id)} />
        ))}
      </div>

      {section ? (
        <div className="clinical-surface space-y-4 rounded-2xl border p-4">
          <h2 className="text-lg font-black text-[var(--clinical-primary-deep)]">{section.titleRu}</h2>

          {(
            [
              ["Learning objectives", section.learningObjectives],
              ["Key concepts", section.keyConcepts],
              ["Clinical pearls", section.clinicalPearls],
              ["Common mistakes", section.commonMistakes],
              ["Resident tips", section.residentTips],
              ["Exam tips", section.examTips],
              ["Board review", section.boardReviewFacts],
            ] as const
          ).map(([title, items]) => (
            <CalcStepCard key={title} title={title}>
              <ul className="list-inside list-disc text-sm">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CalcStepCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}
