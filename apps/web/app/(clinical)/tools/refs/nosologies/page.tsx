import { NosologyListClient } from "@/components/nosology/NosologyListClient";

type Props = { searchParams: Promise<{ studyId?: string }> };

/** Якорь `#book-atlas` в HTML до гидрации (клиентская секция ниже по странице). */
function BookAtlasHashLandmark() {
  return <span id="book-atlas" className="sr-only" tabIndex={-1} />;
}

export default async function NosologiesPage({ searchParams }: Props) {
  const { studyId } = await searchParams;
  return (
    <>
      <BookAtlasHashLandmark />
      <NosologyListClient studyId={studyId ?? null} />
    </>
  );
}
