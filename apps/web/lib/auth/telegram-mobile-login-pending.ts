import { randomUUID } from "node:crypto";

import type { TelegramPayload } from "@/lib/auth/telegram-supabase";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const TTL_MS = 10 * 60 * 1000;
const MOBILE_SCHEME = "com.yakrav7700.usriskcalc";

export type TelegramLoginPoll =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "ok"; nonce: string; payload: TelegramPayload };

export async function purgeExpiredTelegramLoginPending(): Promise<void> {
  const admin = createServiceRoleClient();
  await admin.from("telegram_login_pending").delete().lt("expires_at", new Date().toISOString());
}

export async function createTelegramMobileLoginPending(botUsername: string): Promise<{
  nonce: string;
  botUrl: string;
  deepLink: string;
}> {
  await purgeExpiredTelegramLoginPending();
  const admin = createServiceRoleClient();
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  const { error } = await admin.from("telegram_login_pending").insert({
    nonce,
    status: "pending",
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  const user = botUsername.replace(/^@/, "");
  return {
    nonce,
    botUrl: user ? `https://t.me/${user}?start=login_${nonce}` : "",
    deepLink: `${MOBILE_SCHEME}://auth/callback?telegram_nonce=${nonce}`,
  };
}

export async function confirmTelegramMobileLoginPending(
  nonce: string,
  payload: TelegramPayload,
): Promise<boolean> {
  await purgeExpiredTelegramLoginPending();
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("telegram_login_pending")
    .select("nonce, status, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();
  if (error || !data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from("telegram_login_pending").delete().eq("nonce", nonce);
    return false;
  }
  if (data.status !== "pending") return false;

  const { error: upd } = await admin
    .from("telegram_login_pending")
    .update({ status: "confirmed", payload })
    .eq("nonce", nonce);
  return !upd;
}

export async function pollTelegramMobileLoginPending(nonce: string): Promise<TelegramLoginPoll> {
  await purgeExpiredTelegramLoginPending();
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("telegram_login_pending")
    .select("status, payload, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error || !data) {
    return { status: "expired" };
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from("telegram_login_pending").delete().eq("nonce", nonce);
    return { status: "expired" };
  }
  if (data.status === "confirmed" && data.payload && typeof data.payload === "object") {
    return {
      status: "ok",
      nonce,
      payload: data.payload as TelegramPayload,
    };
  }
  return { status: "pending" };
}

export async function consumeTelegramMobileLoginPending(
  nonce: string,
): Promise<TelegramPayload | null> {
  await purgeExpiredTelegramLoginPending();
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("telegram_login_pending")
    .select("status, payload, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from("telegram_login_pending").delete().eq("nonce", nonce);
    return null;
  }
  if (data.status !== "confirmed" || !data.payload || typeof data.payload !== "object") {
    return null;
  }

  await admin
    .from("telegram_login_pending")
    .update({ status: "consumed" })
    .eq("nonce", nonce);

  return data.payload as TelegramPayload;
}