import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);

/** Admin: run RF source monitor now (same as cron script). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireAdminRole(supabase, user.id);
  if (!gate.ok) return gate.response;

  try {
    const webRoot = process.cwd();
    const { stdout, stderr } = await execFileAsync("node", ["scripts/ingest-rf-regulations.mjs"], {
      cwd: webRoot,
      env: process.env,
    });
    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(-2500),
      stderr: stderr.slice(-400),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
