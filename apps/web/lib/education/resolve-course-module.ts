export type CourseModuleRef = { id: string };

/** curriculum.json uses short ids (m00, t00); files are m00_physics.md, t00_epidemiology_anatomy.md */
export function resolveCourseModuleId(modules: CourseModuleRef[], ref: string): string {
  const exact = modules.find((m) => m.id === ref);
  if (exact) return exact.id;
  const prefixed = modules.find((m) => m.id.startsWith(`${ref}_`));
  if (prefixed) return prefixed.id;
  const loose = modules.find((m) => m.id.startsWith(ref));
  return loose?.id ?? ref;
}
