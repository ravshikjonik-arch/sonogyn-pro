"use client";

type VimeoPlayerProps = {
  videoId: string;
  title?: string;
  className?: string;
};

/** Vimeo — альтернатива YouTube для РФ. */
export function VimeoPlayer({ videoId, title = "Видеоурок", className }: VimeoPlayerProps) {
  return (
    <div className={`aspect-video overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
      <iframe
        title={title}
        className="h-full w-full"
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
