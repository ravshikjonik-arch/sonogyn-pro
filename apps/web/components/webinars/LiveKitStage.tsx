"use client";

import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

type Props = {
  token: string;
  serverUrl: string;
  isHost: boolean;
};

export function LiveKitStage({ token, serverUrl, isHost }: Props) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio={isHost}
      video={isHost}
      className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black"
      style={{ minHeight: "min(70vh, 520px)" }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
