import {
  searchClinicalTools,
  searchEducationModules,
  searchModules,
  type ClinicalTool,
  type DoctorRole,
  type ModuleSearchHit,
} from "@repo/clinical-tools";

export type UnifiedSearchHit =
  | { kind: "tool"; score: number; tool: ClinicalTool }
  | { kind: "module"; score: number; module: ModuleSearchHit };

function moduleToTool(module: ModuleSearchHit): ClinicalTool | null {
  const byHref = searchClinicalTools("", { limit: 200 }).find((t) => t.webHref === module.href);
  if (byHref) return byHref;
  return null;
}

/**
 * Native search: калькуляторы (catalog) + модули SSOT без дублирования формул.
 * Web-only refs открываются через in-app browser (openWebPath).
 */
export function unifiedClinicalSearch(
  rawQuery: string,
  options: { role?: DoctorRole; limit?: number } = {},
): UnifiedSearchHit[] {
  const limit = options.limit ?? 12;
  const toolHits = searchClinicalTools(rawQuery, {
    role: options.role,
    limit: Math.ceil(limit * 0.6),
  }).map((tool) => ({ kind: "tool" as const, score: tool.score ?? 50, tool }));

  const seenHrefs = new Set(toolHits.map((h) => h.tool.webHref));
  const moduleHits: UnifiedSearchHit[] = [];

  for (const mod of [...searchModules(rawQuery, 8), ...searchEducationModules(rawQuery, 4)]) {
    if (seenHrefs.has(mod.href)) continue;
    const mapped = moduleToTool(mod);
    if (mapped && !seenHrefs.has(mapped.webHref)) {
      seenHrefs.add(mapped.webHref);
      moduleHits.push({ kind: "tool", score: mod.score, tool: mapped });
      continue;
    }
    seenHrefs.add(mod.href);
    moduleHits.push({ kind: "module", score: mod.score, module: mod });
  }

  return [...toolHits, ...moduleHits]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
