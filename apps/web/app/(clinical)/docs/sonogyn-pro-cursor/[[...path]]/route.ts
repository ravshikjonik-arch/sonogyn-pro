import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

const DOCS_ROOT = path.join(process.cwd(), "docs", "sonogyn-pro-cursor");

const MIME: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function safeJoin(base: string, segments: string[]): string | null {
  const resolved = path.normalize(path.join(base, ...segments));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path: segments } = await ctx.params;
  const parts = segments?.length ? segments : ["00_README.md"];
  const filePath = safeJoin(DOCS_ROOT, parts);
  if (!filePath) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": ext === ".png" ? "public, max-age=86400" : "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
