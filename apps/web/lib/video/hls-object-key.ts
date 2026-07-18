/** Resolve S3 object key for HLS segment proxy — blocks path traversal (.., absolute paths). */
export function resolveHlsObjectKey(hlsPlaylistKey: string, pathSegments?: string[]): string | null {
  const hlsBase = hlsPlaylistKey.trim();
  if (!hlsBase) return null;

  const hlsDir = hlsBase.replace(/\/[^/]+$/, "/");
  const relPath = pathSegments?.length ? pathSegments.join("/") : "master.m3u8";

  if (
    !relPath ||
    relPath.includes("..") ||
    relPath.startsWith("/") ||
    relPath.includes("\\") ||
    !/^[a-zA-Z0-9._/-]+$/.test(relPath)
  ) {
    return null;
  }

  const objectKey = relPath === "master.m3u8" ? hlsBase : `${hlsDir}${relPath}`;
  if (!objectKey.startsWith(hlsDir)) return null;

  return objectKey;
}
