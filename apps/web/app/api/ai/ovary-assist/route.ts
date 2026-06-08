import { NextResponse } from "next/server";

import {
  analyzeOvaryUltrasoundAssist,
  type OvaryAiAssistInput,
} from "@/lib/ai/ovary-ultrasound-assist";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && !isDevSkipAuthEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: OvaryAiAssistInput;
  try {
    body = (await request.json()) as OvaryAiAssistInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = analyzeOvaryUltrasoundAssist(body);
  return NextResponse.json({ result, meta: { pipeline: "ovary-assist-v1", assistive: true } });
}
