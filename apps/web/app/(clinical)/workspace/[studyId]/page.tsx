import Link from "next/link";
import { redirect } from "next/navigation";
import { CdsPreviewPanel } from "@/components/copilot/CdsPreviewPanel";
import { ImageSeriesUploader } from "@/components/copilot/ImageSeriesUploader";
import { StudyProtocolSection } from "@/components/protocol/StudyProtocolSection";
import { ULTRASOUND_MEDIA_BUCKET } from "@/lib/copilot/types";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

type StudyImageRow = {
  id: string;
  file_name: string;
  storage_path: string;
  series_id: string;
};

export default async function StudyWorkspacePage(props: {
  params: Promise<Params>;
}) {
  const { studyId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at,patient_id")
    .eq("id", studyId)
    .maybeSingle();

  let patientLabel = "Пациент";
  if (study?.patient_id) {
    const { data: patient } = await supabase
      .from("patients")
      .select("display_label")
      .eq("id", study.patient_id)
      .maybeSingle();
    if (patient?.display_label) patientLabel = patient.display_label;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (studyError || !study) {
    return (
      <main className="px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-bold">Исследование недоступно</p>
          <p className="mt-2">
            Убедитесь, что SQL-миграция применена и у вас есть доступ к записи.
          </p>
          <Link className="mt-4 inline-flex font-bold text-blue-700" href="/workspace">
            ← Назад к списку
          </Link>
        </div>
      </main>
    );
  }

  const { data: series, error: seriesError } = await supabase
    .from("ultrasound_series")
    .select("id,label,plane_or_region,sort_order,created_at")
    .eq("study_id", studyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const seriesRows = series ?? [];
  const seriesIds = seriesRows.map((s) => s.id);

  let imageRows: StudyImageRow[] = [];

  if (seriesIds.length > 0) {
    const { data: images } = await supabase
      .from("ultrasound_images")
      .select("id,file_name,storage_path,byte_size,created_at,series_id")
      .in("series_id", seriesIds)
      .order("created_at", { ascending: true });

    imageRows = (images ?? []) as StudyImageRow[];
  }

  const previewUrls: { id: string; url: string }[] = [];

  for (const image of imageRows) {
    const { data: signed, error: signError } = await supabase.storage
      .from(ULTRASOUND_MEDIA_BUCKET)
      .createSignedUrl(image.storage_path, 60 * 30);

    if (!signError && signed?.signedUrl) {
      previewUrls.push({ id: image.id, url: signed.signedUrl });
    }
  }

  const urlById = new Map(previewUrls.map((p) => [p.id, p.url]));

  return (
    <main className="px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-sm font-bold text-blue-700" href="/workspace">
              ← Все исследования
            </Link>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Study workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {study.title ?? "Исследование без названия"}
            </h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {study.study_type} · {study.status}
            </p>
          </div>
        </div>

        <StudyProtocolSection
          studyId={study.id}
          studyTitle={study.title ?? "УЗИ"}
          patientLabel={patientLabel}
          sessionSeed={user.id}
          physicianName={profile?.full_name ?? undefined}
        />

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <ImageSeriesUploader studyId={study.id} series={seriesRows} />

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">Таймлайн медиа</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {imageRows.length} файлов
                </span>
              </div>

              {seriesError ? (
                <p className="mt-3 text-sm text-red-700">
                  Ошибка чтения серий — проверьте миграцию.
                </p>
              ) : null}

              <div className="mt-4 space-y-4">
                {seriesRows.map((s) => {
                  const imgs = imageRows.filter((img) => img.series_id === s.id);

                  return (
                    <div key={s.id} className="rounded-xl border border-slate-100 p-3">
                      <p className="text-sm font-bold text-slate-900">
                        {s.label ?? "Series"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.plane_or_region ?? "Регион не указан"}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {imgs.map((img) => {
                          const src = urlById.get(img.id);

                          return (
                            <figure
                              key={img.id}
                              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              {src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={img.file_name}
                                  className="h-28 w-full object-cover"
                                  src={src}
                                />
                              ) : (
                                <div className="flex h-28 items-center justify-center px-2 text-center text-[11px] font-semibold text-slate-500">
                                  Нет превью
                                </div>
                              )}
                              <figcaption className="truncate px-2 py-1 text-[11px] text-slate-600">
                                {img.file_name}
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <CdsPreviewPanel studyId={study.id} />
          </aside>
        </div>
      </div>
    </main>
  );
}
