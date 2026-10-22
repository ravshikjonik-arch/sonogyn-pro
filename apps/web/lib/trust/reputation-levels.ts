export type ReputationLevelId = "novice" | "practitioner" | "expert" | "authority";

export type ReputationLevel = {
  id: ReputationLevelId;
  label: string;
  min: number;
  className: string;
};

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { id: "novice", label: "Новичок", min: 0, className: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100" },
  { id: "practitioner", label: "Практик", min: 50, className: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-100" },
  { id: "expert", label: "Эксперт", min: 200, className: "bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950 dark:text-violet-100" },
  { id: "authority", label: "Авторитет", min: 500, className: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100" },
];

export function resolveReputationLevel(reputation: number): ReputationLevel {
  const score = Number.isFinite(reputation) ? Math.max(0, reputation) : 0;
  let current = REPUTATION_LEVELS[0]!;
  for (const level of REPUTATION_LEVELS) {
    if (score >= level.min) current = level;
  }
  return current;
}
