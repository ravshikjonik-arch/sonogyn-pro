import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { clearExternalGuidelinesCache } from "@/lib/evidence/load-external-guidelines";
import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);

/** Weekly cron: NICE atom + WHO seed → guidelines_external_index */
export async function GET(req: Request) {
  if (!isInternalNotifyAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webRoot = process.cwd();
    const { stdout, stderr } = await execFileAsync("node", ["scripts/ingest-external-guidelines.mjs"], {
      cwd: webRoot,
      env: process.env,
    });
    clearExternalGuidelinesCache();
    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-500),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
