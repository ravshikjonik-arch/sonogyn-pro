import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const modulesDir = join(packageRoot, "data/modules");

/** Server / build-time only — reads markdown from disk (Next.js RSC). */
export function listModuleIds(): string[] {
  return readdirSync(modulesDir)
    .filter((f: string) => f.endsWith(".md") && /^m/i.test(f))
    .map((f: string) => f.replace(/\.md$/, ""))
    .sort();
}

export function readModuleMarkdown(moduleId: string): string | null {
  const safe = moduleId.replace(/[^a-z0-9_]/gi, "");
  const path = join(modulesDir, `${safe}.md`);
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}
