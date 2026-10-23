import t00_epidemiology_anatomy from "../data/modules/t00_epidemiology_anatomy.md";
import t01_diagnostics from "../data/modules/t01_diagnostics.md";
import t02_bmode_terminology from "../data/modules/t02_bmode_terminology.md";
import t03_doppler from "../data/modules/t03_doppler.md";
import t04_elastography from "../data/modules/t04_elastography.md";
import t05_uz_criteria from "../data/modules/t05_uz_criteria.md";
import t06_tirads from "../data/modules/t06_tirads.md";
import t07_fna from "../data/modules/t07_fna.md";
import t08_lymph_nodes from "../data/modules/t08_lymph_nodes.md";
import t09_conclusion from "../data/modules/t09_conclusion.md";
import t10_appendices from "../data/modules/t10_appendices.md";

const MODULE_MARKDOWN: Record<string, string> = {
  t00_epidemiology_anatomy,
  t01_diagnostics,
  t02_bmode_terminology,
  t03_doppler,
  t04_elastography,
  t05_uz_criteria,
  t06_tirads,
  t07_fna,
  t08_lymph_nodes,
  t09_conclusion,
  t10_appendices,
};

export function listModuleIds(): string[] {
  return Object.keys(MODULE_MARKDOWN).sort();
}

export function readModuleMarkdown(moduleId: string): string | null {
  const safe = moduleId.replace(/[^a-z0-9_]/gi, "");
  return MODULE_MARKDOWN[safe] ?? null;
}
