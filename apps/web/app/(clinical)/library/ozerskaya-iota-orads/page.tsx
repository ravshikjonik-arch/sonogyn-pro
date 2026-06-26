import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ chapter?: string; page?: string }> };

/** Постоянный редирект на canonical O-RADS эхограммы (сохраняем query). */
export default async function LegacyOzerskayaLibraryRedirect({ searchParams }: Props) {
  const { chapter, page } = await searchParams;
  const params = new URLSearchParams();
  if (chapter) params.set("chapter", chapter);
  if (page) params.set("page", page);
  const q = params.toString();
  redirect(`/tools/refs/orads-echograms${q ? `?${q}` : ""}`);
}
