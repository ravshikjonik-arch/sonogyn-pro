import { getPlatformRepo, type PlatformRepo } from "@/lib/platform-repos";

export async function loadPlatformRepoText(repo: PlatformRepo): Promise<{ text: string; source: "github" }> {
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
