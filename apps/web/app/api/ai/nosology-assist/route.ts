import { NextResponse } from "next/server";

import {
  analyzeNosologyUltrasoundAssist,
  type NosologyAiAssistInput,
} from "@/lib/ai/nosology-ultrasound-assist";
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

  let body: NosologyAiAssistInput;
  try {
    body = (await request.json()) as NosologyAiAssistInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.context?.title) {
    return NextResponse.json({ error: "context.title required" }, { status: 400 });
  }

  const result = analyzeNosologyUltrasoundAssist(body);
  return NextResponse.json({ result, meta: { pipeline: "nosology-assist-v1", assistive: true } });
}
