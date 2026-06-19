export type VideoProvider = "youtube" | "vimeo" | "upload";

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed?.[1]) return embed[1];
    const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts?.[1]) return shorts[1];
  } catch {
    return null;
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/(\d+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function detectVideoProvider(url: string | null | undefined): VideoProvider | null {
  if (!url?.trim()) return null;
  if (extractYouTubeId(url)) return "youtube";
  if (extractVimeoId(url)) return "vimeo";
  return null;
}

export function resolveVideoProvider(params: {
  videoUrl?: string | null;
  videoFileKey?: string | null;
  videoStoragePath?: string | null;
  explicit?: string | null;
}): VideoProvider | null {
  if (params.explicit === "youtube" || params.explicit === "vimeo" || params.explicit === "upload") {
    return params.explicit;
  }
  if (params.videoFileKey || params.videoStoragePath) return "upload";
  return detectVideoProvider(params.videoUrl);
}
