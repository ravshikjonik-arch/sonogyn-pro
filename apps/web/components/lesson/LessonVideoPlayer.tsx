"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type PlaybackInfo =
  | { kind: "external"; url: string }
  | { kind: "hls"; url: string }
  | { kind: "mp4"; url: string; processing?: boolean };

type LessonVideoPlayerProps = {
  lessonId: string;
  className?: string;
};

export function LessonVideoPlayer({ lessonId, className }: LessonVideoPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      const res = await fetch(`/api/lessons/${lessonId}/playback`, { credentials: "same-origin" });
      const body = (await res.json()) as {
        ok?: boolean;
        kind?: "external" | "hls" | "mp4";
        url?: string;
        processing?: boolean;
        error?: string;
      };

      if (cancelled) return;
      if (!res.ok || !body.ok || !body.url || !body.kind) {
        setError(typeof body.error === "string" ? body.error : "Видео недоступно");
        setPlayback(null);
        setLoading(false);
        return;
      }

      setPlayback({
        kind: body.kind,
        url: body.url,
        processing: body.processing,
      } as PlaybackInfo);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (loading) {
    return (
      <div className={`flex aspect-video items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 ${className ?? ""}`}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !playback) {
    return (
      <div className={`flex aspect-video items-center justify-center rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-600 dark:bg-slate-900 ${className ?? ""}`}>
        {error || "Видео не найдено"}
      </div>
    );
  }

  const isHls = playback.kind === "hls";

  return (
    <div className={`overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
      <div className="relative aspect-video">
        <ReactPlayer
          src={playback.url}
          controls
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
          config={{
            html: {
              attributes: {
                controlsList: "nodownload",
              },
            },
            ...(isHls ? { hls: { enableWorker: true } } : {}),
          }}
        />
      </div>
      {playback.kind === "mp4" && "processing" in playback && playback.processing ? (
        <p className="bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          HLS ещё готовится — пока воспроизведение исходного MP4.
        </p>
      ) : null}
    </div>
  );
}
