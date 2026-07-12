export type SmtpConfig = {
  host: string;
  connectHost?: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

/** Mailgun / generic SMTP from env (SMTP_PASSWORD or legacy SMTP_PASS). */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const connectHost = process.env.SMTP_CONNECT_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password =
    process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    (user ? `SonoGyn Pro <${user}>` : undefined);

  if (!host || !user || !password || !from) return null;

  const port = Number.parseInt(portRaw ?? "587", 10);
  if (!Number.isFinite(port) || port <= 0) return null;

  return { host, connectHost: connectHost || undefined, port, user, password, from };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}
