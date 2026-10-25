import { notFound } from "next/navigation";

import { PlatformRepoDocument } from "@/components/platform/PlatformRepoDocument";
import { loadPlatformRepoBySlug } from "@/lib/platform-repos-load";
import { PLATFORM_REPOS, getPlatformRepo } from "@/lib/platform-repos";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return PLATFORM_REPOS.map((repo) => ({ slug: repo.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const repo = getPlatformRepo(slug);
  return { title: repo ? repo.title : "Репозиторий" };
}

export default async function PlatformRepoPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadPlatformRepoBySlug(slug).catch(() => null);
  if (!loaded) notFound();

  return <PlatformRepoDocument repo={loaded.repo} text={loaded.text} source={loaded.source} />;
}
