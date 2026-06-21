/** Собирает Headers без undefined — совместимо со strict RequestInit. */
export function buildFetchHeaders(headers: Record<string, string | undefined>): Headers {
  const out = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) out.set(key, value);
  }
  return out;
}

export function jsonRequestInit(options: {
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: BodyInit | null;
  cache?: RequestCache;
}): RequestInit {
  return {
    method: options.method ?? "POST",
    headers: buildFetchHeaders({
      "Content-Type": "application/json",
      ...options.headers,
    }),
    body: options.body,
    ...(options.cache ? { cache: options.cache } : {}),
  };
}
