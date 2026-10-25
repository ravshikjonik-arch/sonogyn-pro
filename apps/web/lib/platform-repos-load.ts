import { readFile } from "node:fs/promises";
import path from "node:path";

import { getPlatformRepo, type PlatformRepo } from "@/lib/platform-repos";

export async function loadPlatformRepoText(repo: PlatformRepo): Promise<{ text: string; source: "project" | "github" }> {
  const localPath = path.join(process.cwd(), "..", "..", repo.dir, repo.readme);
  try {
    const text = await readFile(localPath, "utf8");
    if (text.trim()) return { text, source: "project" };
  } catch {
    // Папки нет на сервере деплоя — берём тот же файл с GitHub.
  }

  const response = await fetch(repo.rawUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Не удалось прочитать ${repo.title}`);
  }
  return { text: await response.text(), source: "github" };
}

export async function loadPlatformRepoBySlug(slug: string) {
  const repo = getPlatformRepo(slug);
  if (!repo) return null;
  const document = await loadPlatformRepoText(repo);
  return { repo, ...document };
}
