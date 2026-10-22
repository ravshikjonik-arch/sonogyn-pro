export type MicMonitor = {
  stop: () => void;
};

/** RMS level 0..1 for VU indicator */
export async function startMicLevelMonitor(onLevel: (level: number) => void): Promise<MicMonitor | null> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;

  let stream: MediaStream | null = null;
  let raf = 0;
  let closed = false;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch {
    return null;
  }

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  const tick = () => {
    if (closed) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    onLevel(Math.min(1, rms * 2.5));
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    stop: () => {
      closed = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
