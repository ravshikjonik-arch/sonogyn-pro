import { createHash } from "node:crypto";

import { createServiceRoleClient } from "@/utils/supabase/admin";

const GUEST_CHAT_EMAIL = "chat-guest@sonogyn.pro";

let cachedGuestAuthorId: string | null = null;

/** Shared author for messages sent without an account. The visitor never sees a signup form. */
export async function resolveGuestChatAuthorId(): Promise<string> {
  if (cachedGuestAuthorId) return cachedGuestAuthorId;

  const admin = createServiceRoleClient();
  const password = createHash("sha256")
    .update(`sonogyn-chat-guest:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 40);

  const existing = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: GUEST_CHAT_EMAIL,
  });
  const existingId = existing.data.user?.id;
  if (existingId) {
    cachedGuestAuthorId = existingId;
    return existingId;
  }

  const created = await admin.auth.admin.createUser({
    email: GUEST_CHAT_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Гость" },
  });
  const createdId = created.data.user?.id;
  if (!createdId) {
    throw new Error(created.error?.message ?? existing.error?.message ?? "Не удалось открыть чат без регистрации");
  }

  cachedGuestAuthorId = createdId;
  return createdId;
}
