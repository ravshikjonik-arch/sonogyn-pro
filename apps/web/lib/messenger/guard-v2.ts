import { NextResponse } from "next/server";

import { isDoctorChatV2Enabled } from "@/lib/chat/flags";

export function rejectUnlessDoctorChatV2Enabled(): NextResponse | null {
  if (!isDoctorChatV2Enabled()) {
    return NextResponse.json({ error: "Doctor chat v2 is disabled" }, { status: 404 });
  }
  return null;
}
