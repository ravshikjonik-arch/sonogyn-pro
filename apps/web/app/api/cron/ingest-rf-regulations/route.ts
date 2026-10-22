import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);

/** Cron: monitor RF regulation sources → regulation_ingest_queue */
export async function GET(req: Request) {
  if (!isInternalNotifyAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webRoot = process.cwd();
    const { stdout, stderr } = await execFileAsync("node", ["scripts/ingest-rf-regulations.mjs"], {
      cwd: webRoot,
      env: process.env,
    });
    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(-2500),
      stderr: stderr.slice(-500),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
