"use client";

import { ImageIcon, Loader2, Upload, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCaseMediaSignedUrl,
  uploadCaseMedia,
  type CaseMediaRow,
} from "@/lib/supabase/case-media-storage";

type Props = {
  caseId: string;
  userId: string;
  canUpload: boolean;
};

type MediaView = CaseMediaRow & { url: string | null };

export function CaseMediaGallery({ caseId, userId, canUpload }: Props) {
  const supabase = useSupabase();
  const [items, setItems] = useState<MediaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("case_media")
      .select("id,case_id,storage_path,media_type,order_index,uploaded_at")
      .eq("case_id", caseId)
      .order("order_index", { ascending: true });

    if (error) {
      toast.error("Не удалось загрузить снимки кейса");
      setItems([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as CaseMediaRow[];
    const withUrls = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: await getCaseMediaSignedUrl(supabase, row.storage_path),
      })),
    );
    setItems(withUrls);
    setLoading(false);
  }, [caseId, supabase]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length || !canUpload) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const res = await uploadCaseMedia(supabase, { userId, caseId, file });
        if ("error" in res) {
          toast.error(res.error);
        } else {
          toast.success(file.type.startsWith("video/") ? "Видео добавлено" : "Снимок добавлен");
        }
      }
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="border-[var(--clinical-border)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-lg">Снимки и видео кейса</CardTitle>
        {canUpload ? (
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--clinical-primary)] px-3 py-2 text-xs font-semibold hover:bg-[var(--clinical-primary-muted)]">
              <ImageIcon className="h-4 w-4" />
              Фото УЗИ
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onFiles(e.target.files)}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--clinical-primary)] px-3 py-2 text-xs font-semibold hover:bg-[var(--clinical-primary-muted)]">
              <Video className="h-4 w-4" />
              Видео
              <input
                type="file"
                accept="video/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onFiles(e.target.files)}
              />
            </label>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[var(--clinical-foreground-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка медиа…
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-[var(--clinical-foreground-muted)]" />
            <p className="mt-2 text-sm font-semibold">Пока без снимков</p>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
              {canUpload
                ? "Загрузите фото или видео УЗИ — коллеги увидят в обсуждении (без PHI, только учебные кейсы)."
                : "Автор кейса ещё не прикрепил медиа."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-black/5"
              >
                {item.url && item.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="Снимок кейса" className="max-h-56 w-full object-contain" />
                ) : item.url && item.media_type === "video" ? (
                  <video src={item.url} controls className="max-h-56 w-full" />
                ) : (
                  <p className="p-4 text-xs text-[var(--clinical-foreground-muted)]">Превью недоступно</p>
                )}
                <p className="px-3 py-2 text-[10px] text-[var(--clinical-foreground-muted)]">
                  {item.media_type} · {new Date(item.uploaded_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
        {uploading ? (
          <Button type="button" size="sm" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка…
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
