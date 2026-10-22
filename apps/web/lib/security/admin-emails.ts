/** Список email модераторов верификации (через env, без хардкода в клиенте). */
export function parseAdminEmailsEnv(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmailsEnv(process.env.ADMIN_EMAILS).has(email.trim().toLowerCase());
}
