export function getChatApiBase(): string {
  return (process.env.EXPO_PUBLIC_CHAT_API_URL || "").replace(/\/$/, "");
}

type ApiUser = { id: string; email: string; displayName: string };
export type ChatUserRole = "admin" | "doctor";
export type ApiAuthUser = ApiUser & {
  role: ChatUserRole;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedUntil?: string | null;
};
export type AdminUser = ApiAuthUser & {
  createdAt: string;
};

export async function apiRegister(
  email: string,
  password: string,
  displayName: string
): Promise<{ token: string; user: ApiAuthUser }> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as { token: string; user: ApiAuthUser };
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: ApiAuthUser }> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as { token: string; user: ApiAuthUser };
}

export async function apiMe(token: string): Promise<ApiAuthUser> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as ApiAuthUser;
}

export type RemoteCaseComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type RemoteCase = {
  id: string;
  author: string;
  title: string;
  description: string;
  imageUri: string | null;
  createdAt: string;
  visibility: "public" | "private";
  tags: string[];
  comments: RemoteCaseComment[];
};

export async function apiFetchCases(token: string): Promise<RemoteCase[]> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/cases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return (data.cases || []) as RemoteCase[];
}

export async function apiCreateCase(
  token: string,
  params: {
    title: string;
    description: string;
    visibility: "public" | "private";
    tags: string[];
    imageUri: string | null;
  }
): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");

  const form = new FormData();
  form.append("title", params.title);
  form.append("description", params.description);
  form.append("visibility", params.visibility);
  form.append("tags", JSON.stringify(params.tags));

  if (params.imageUri) {
    const name = params.imageUri.split("/").pop() || "photo.jpg";
    const ext = name.toLowerCase().includes("png") ? "image/png" : "image/jpeg";
    form.append("image", { uri: params.imageUri, name, type: ext } as unknown as Blob);
  }

  const res = await fetch(`${base}/cases`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export async function apiAddComment(token: string, caseId: string, text: string): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/cases/${encodeURIComponent(caseId)}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export async function apiAdminListUsers(token: string): Promise<AdminUser[]> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return (data.users || []) as AdminUser[];
}

export async function apiAdminSetBlocked(
  token: string,
  userId: string,
  blocked: boolean,
  reason = ""
): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const endpoint = blocked ? `/admin/users/${encodeURIComponent(userId)}/block` : `/admin/users/${encodeURIComponent(userId)}/unblock`;
  const res = await fetch(`${base}${endpoint}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: blocked ? JSON.stringify({ reason }) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export async function apiAdminRevokeChatSessions(token: string, userId: string): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/admin/users/${encodeURIComponent(userId)}/revoke-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export async function apiAdminDeleteCase(token: string, caseId: string): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(`${base}/admin/cases/${encodeURIComponent(caseId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export async function apiAdminDeleteComment(
  token: string,
  caseId: string,
  commentId: string
): Promise<void> {
  const base = getChatApiBase();
  if (!base) throw new Error("API не настроен");
  const res = await fetch(
    `${base}/admin/cases/${encodeURIComponent(caseId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
}

export type TelegramAuthStart = {
  nonce: string;
  botUrl: string;
  deepLink: string;
};

export type TelegramAuthPoll =
  | { status: "pending" }
  | { status: "ok"; payload: Record<string, unknown>; nonce?: string }
  | { status: "expired" };

export async function apiTelegramAuthStart(): Promise<TelegramAuthStart> {
  const base = getChatApiBase();
  if (!base) throw new Error("Telegram auth API не настроен (EXPO_PUBLIC_CHAT_API_URL).");
  const res = await fetch(`${base}/auth/telegram/start`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as TelegramAuthStart;
}

export async function apiTelegramAuthPoll(nonce: string): Promise<TelegramAuthPoll> {
  const base = getChatApiBase();
  if (!base) throw new Error("Telegram auth API не настроен.");
  const res = await fetch(`${base}/auth/telegram/poll/${encodeURIComponent(nonce)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as TelegramAuthPoll;
}

export function getWebApiBase(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (configured) return configured;
  if (typeof __DEV__ !== "undefined" && __DEV__) return "http://localhost:3000";
  return "";
}

export async function apiTelegramSupabaseSession(nonce: string): Promise<{
  access_token: string;
  refresh_token: string;
  email?: string;
}> {
  const base = getChatApiBase();
  if (!base) throw new Error("EXPO_PUBLIC_CHAT_API_URL не задан (chat-server).");
  const res = await fetch(`${base}/auth/telegram/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nonce }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.session) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  return data.session as { access_token: string; refresh_token: string; email?: string };
}
