"use client";

type YouTubePlayerProps = {
  videoId: string;
  title?: string;
  className?: string;
};

/** YouTube embed (nocookie). В РФ может тормозить — используйте Vimeo или своё видео. */
export function YouTubePlayer({ videoId, title = "Видеоурок", className }: YouTubePlayerProps) {
  return (
    <div className={`aspect-video overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
      <iframe
        title={title}
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
