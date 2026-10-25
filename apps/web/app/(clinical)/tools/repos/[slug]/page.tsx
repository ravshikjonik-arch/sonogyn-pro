import { notFound } from "next/navigation";

import { PlatformRepoDocument } from "@/components/platform/PlatformRepoDocument";
import { loadPlatformRepoBySlug } from "@/lib/platform-repos-load";
import { getPlatformRepo } from "@/lib/platform-repos";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const repo = getPlatformRepo(slug);
  return { title: repo ? repo.title : "Репозиторий" };
}

export default async function PlatformRepoPage({ params }: Props) {
  const { slug } = await params;
  const repo = getPlatformRepo(slug);
  if (!repo) notFound();
  const loaded = await loadPlatformRepoBySlug(slug).catch(() => null);
  if (!loaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-black tracking-tight">{repo.title}</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">Текст репозитория сейчас не открылся.</p>
      </div>
    );
  }

  return <PlatformRepoDocument repo={loaded.repo} text={loaded.text} source={loaded.source} />;
}
