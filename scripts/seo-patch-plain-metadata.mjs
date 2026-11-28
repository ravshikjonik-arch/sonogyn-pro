#!/usr/bin/env node
/**
 * Конвертирует `export const metadata = { title, description }` → buildPublicMetadata({ path }).
 * Только публичные маршруты под app/(clinical) и lp; пропускает admin/patients/offline.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_APP = path.join(ROOT, "apps/web/app");

const SKIP_SEGMENTS = new Set(["admin", "patients", "api", "auth", "author", "paywall", "dashboard", "profile"]);

function routeFromPageFile(file) {
  const rel = path.relative(WEB_APP, file).replace(/\\/g, "/");
  if (rel.includes("[") || rel === "offline/page.tsx") return null;
  const parts = rel.split("/").filter((p) => p !== "page.tsx" && !p.startsWith("(") && !p.endsWith(")"));
  if (parts.some((p) => SKIP_SEGMENTS.has(p))) return null;
  return "/" + parts.join("/");
}

function stripBrand(title) {
  return title
    .replace(/\s*[·|—\-]\s*SonoGyn Pro\s*$/i, "")
    .replace(/\s+SonoGyn Pro\s*$/i, "")
    .trim();
}

function patchFile(file) {
  let src = fs.readFileSync(file, "utf8");
  if (src.includes("buildPublicMetadata") || src.includes("calculatorPageMetadata")) return false;
  if (!/export const metadata(?::\s*Metadata)?\s*=\s*\{/.test(src)) return false;

  const route = routeFromPageFile(file);
  if (!route) return false;

  const titleMatch = src.match(/title:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/);
  const descMatch = src.match(/description:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/s);
  if (!titleMatch || !descMatch) return false;

  const title = stripBrand(titleMatch[1] ?? titleMatch[2] ?? titleMatch[3] ?? "");
  const description = (descMatch[1] ?? descMatch[2] ?? descMatch[3] ?? "").replace(/\s+/g, " ").trim();
  if (!title || !description) return false;

  src = src.replace(
    /export const metadata(?::\s*Metadata)?\s*=\s*\{[\s\S]*?\};\s*\n/,
    `export const metadata = buildPublicMetadata({\n  title: ${JSON.stringify(title)},\n  description: ${JSON.stringify(description)},\n  path: ${JSON.stringify(route)},\n});\n\n`,
  );

  if (!src.includes("@/lib/seo/build-public-metadata")) {
    if (src.includes('import type { Metadata } from "next";\n')) {
      src = src.replace(
        'import type { Metadata } from "next";\n',
        'import type { Metadata } from "next";\n\nimport { buildPublicMetadata } from "@/lib/seo/build-public-metadata";\n',
      );
    } else {
      const firstImport = src.match(/^import .+;\n/m);
      if (firstImport) {
        src = src.replace(firstImport[0], `${firstImport[0]}import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";\n`);
      } else {
        src = `import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";\n\n${src}`;
      }
    }
  }

  fs.writeFileSync(file, src);
  return true;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name === "page.tsx") out.push(full);
  }
  return out;
}

const files = walk(WEB_APP);
let n = 0;
for (const f of files) {
  if (patchFile(f)) {
    n++;
    console.log("patched", path.relative(ROOT, f));
  }
}
console.log(`\nDone: ${n} files`);