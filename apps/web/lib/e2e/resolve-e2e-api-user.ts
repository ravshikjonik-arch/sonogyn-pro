import { NextResponse } from "next/server";

import { e2eStubUserFromRequest } from "@/lib/e2e/auth-stub";
import { isE2eCiStubMode } from "@/lib/e2e/ci-stub";

/** Maps e2e auth cookie to user id in CI stub mode only. */
export function resolveE2eCiStubApiUser(request: Request):
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse }
  | null {
  if (!isE2eCiStubMode()) return null;

  const stub = e2eStubUserFromRequest(request);
  if (!stub || typeof stub.id !== "string") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const email = typeof stub.email === "string" ? stub.email : null;
  return { ok: true, userId: stub.id, email };
}
