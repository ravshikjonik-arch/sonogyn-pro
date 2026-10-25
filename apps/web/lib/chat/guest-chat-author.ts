import { createHash } from "node:crypto";

import { ensureDevUserExists } from "@/lib/auth/dev-account";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const GUEST_CHAT_EMAIL = "chat-guest@sonogyn.pro";

let cachedGuestAuthorId: string | null = null;

/** Shared author for messages sent without an account. The visitor never sees a signup form. */
export async function resolveGuestChatAuthorId(): Promise<string> {
  if (cachedGuestAuthorId) return cachedGuestAuthorId;

  const admin = createServiceRoleClient();
  const lookup = await admin.from("users").select("id").eq("email", GUEST_CHAT_EMAIL).maybeSingle();
  if (!lookup.error && lookup.data?.id) {
    cachedGuestAuthorId = lookup.data.id;
    return lookup.data.id;
  }

  const password = createHash("sha256")
    .update(`sonogyn-chat-guest:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 40);

  const ensured = await ensureDevUserExists({
    email: GUEST_CHAT_EMAIL,
    password,
    full_name: "Гость",
    specialization: "Без регистрации",
    institution: "SonoGyn",
    birth_year: 1990,
  });
  if (!ensured.ok) {
    throw new Error(ensured.message);
  }

  const created = await admin.from("users").select("id").eq("email", GUEST_CHAT_EMAIL).maybeSingle();
  if (!created.data?.id) {
    throw new Error("Не удалось открыть чат без регистрации");
  }

  cachedGuestAuthorId = created.data.id;
  return created.data.id;
}
