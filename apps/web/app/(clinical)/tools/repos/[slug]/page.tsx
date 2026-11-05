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
  if (!repo || !repo.clinicalVisible) return { title: "Исслед. AI" };
  return { title: `${repo.title} · Исслед. AI` };
}

export default async function PlatformRepoPage({ params }: Props) {
  const { slug } = await params;
  const repo = getPlatformRepo(slug);
  // SECURITY/UX: каталоги Awesome скрыты; прямую ссылку тоже не открываем
  if (!repo || !repo.clinicalVisible) notFound();

  const loaded = await loadPlatformRepoBySlug(slug).catch(() => null);

  return <PlatformRepoDocument repo={repo} text={loaded?.text ?? null} />;
}
