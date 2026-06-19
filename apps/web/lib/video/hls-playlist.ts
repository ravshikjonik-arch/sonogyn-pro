/** Переписывает URI сегментов в m3u8 на same-origin proxy с token. */
export function rewriteHlsPlaylist(content: string, proxyBase: string, token: string): string {
  const tokenQuery = `token=${encodeURIComponent(token)}`;
  const base = proxyBase.endsWith("/") ? proxyBase : `${proxyBase}/`;

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const fileName = trimmed.includes("/") ? (trimmed.split("/").pop() ?? trimmed) : trimmed;
      return `${base}${fileName}?${tokenQuery}`;
    })
    .join("\n");
}
